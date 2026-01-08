import { formatResponse } from "@core/prompts/responses"
import { ClineDefaultTool } from "@shared/tools"
import type { ToolResponse } from "../../index"
import type { IFullyManagedTool } from "../ToolExecutorCoordinator"
import type { ToolValidator } from "../ToolValidator"
import type { TaskConfig } from "../types/TaskConfig"
import type { StronglyTypedUIHelpers } from "../types/UIHelpers"
import { ExplorationScratchpad } from "../utils/ExplorationScratchpad"
import { ThinkingEngine } from "../utils/ThinkingEngine"

export class ReasoningToolHandler implements IFullyManagedTool {
	readonly name = ClineDefaultTool.REASONING

	constructor(
		private validator: ToolValidator,
		private explorationScratchpad: ExplorationScratchpad,
		private thinkingEngine?: ThinkingEngine,
		private intelligentThinkingSystem?: any, // Importar IntelligentThinkingSystem quando disponível
	) {}

	getDescription(block: any): string {
		return `[Reasoning: ${block.params.function || "analysis"}]`
	}

	async handlePartialBlock(block: any, uiHelpers: StronglyTypedUIHelpers): Promise<void> {
		// Reasoning tools don't need partial handling
		return
	}

	async execute(config: TaskConfig, block: any): Promise<ToolResponse> {
		const functionName = block.params.function || block.params.reasoning_function

		switch (functionName) {
			case "exploration_summary":
				return await this.generateExplorationSummary()
			case "tough_reasoning": {
				const maxIterationsTough = block.params.max_iterations || 5
				const minConfidence = block.params.min_confidence || 0.85
				return await this.performToughReasoning(maxIterationsTough, minConfidence)
			}
			case "check_cache":
				const toolName = block.params.tool_name
				const query = block.params.query
				const filePath = block.params.file_path
				return this.checkCacheStatus(toolName, query, filePath)
			case "get_exploration_recommendations":
				return this.getExplorationRecommendations()
			case "thinking_history":
				return this.getThinkingHistory()
			case "final_decision":
				return await this.makeFinalDecision()
			case "intelligent_thinking": {
				const maxIterationsThinking = block.params.max_iterations || 5
				return await this.executeIntelligentThinking(maxIterationsThinking)
			}
			case "intelligent_thinking_history":
				return this.getIntelligentThinkingHistory()
			default:
				return formatResponse.toolError(`Unknown reasoning function: ${functionName}`)
		}
	}

	private async generateExplorationSummary(): Promise<string> {
		const summary = this.explorationScratchpad.generateSummary()
		const formatted = this.explorationScratchpad.formatExplorationSummaryForDisplay()

		return `## Exploration Summary\n\n${formatted}\n\n### Raw Data:\n- Total Entries: ${summary.totalEntries}\n- Files Explored: ${summary.filesExplored}\n- Search Queries: ${summary.searchQueries}\n- List Operations: ${summary.listOperations}\n- Confidence Score: ${(summary.confidenceScore * 100).toFixed(1)}%\n\n### Key Findings:\n${summary.keyFindings.map((finding) => `- ${finding}`).join("\n")}`
	}

	private async performToughReasoning(maxIterations: number, minConfidence: number): Promise<string> {
		const result = await this.explorationScratchpad.toughReasoning(maxIterations, minConfidence)

		let output = `## Tough Reasoning Results\n\n`
		output += `**Conclusion:** ${result.conclusion}\n\n`
		output += `**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n\n`
		output += `**Iterations:** ${result.iterations}\n\n`

		if (result.reasoningSteps.length > 0) {
			output += `### Reasoning Steps:\n`
			result.reasoningSteps.forEach((step, index) => {
				output += `${index + 1}. ${step}\n`
			})
		}

		// Transition to execute phase if confidence is high enough
		if (result.confidence >= minConfidence) {
			this.explorationScratchpad.transitionToNextPhase()
			output += `\n✅ **Phase Transition:** Moved to EXECUTE phase`
		}

		return output
	}

	private checkCacheStatus(toolName: string, query: string, filePath?: string): string {
		const hasExplored = this.explorationScratchpad.hasExplored(toolName as ClineDefaultTool, query, filePath)
		const cachedResult = this.explorationScratchpad.getCachedResult(toolName as ClineDefaultTool, query, filePath)

		let output = `## Cache Status Check\n\n`
		output += `**Tool:** ${toolName}\n`
		output += `**Query:** ${query}\n`
		if (filePath) output += `**File Path:** ${filePath}\n`
		output += `**Cache Hit:** ${hasExplored ? "✅ Yes" : "❌ No"}\n\n`

		if (cachedResult) {
			output += `### Cached Result:\n`
			output += `- Confidence: ${(cachedResult.confidence * 100).toFixed(1)}%\n`
			output += `- Timestamp: ${new Date(cachedResult.timestamp).toLocaleString()}\n`
			output += `- Tags: ${cachedResult.tags.join(", ")}\n`
			output += `- Relevance: ${(cachedResult.relevance * 100).toFixed(1)}%\n\n`
			output += `**Result:** ${this.truncateResult(cachedResult.result)}`
		} else {
			output += `No cached result available.`
		}

		return output
	}

	private getExplorationRecommendations(): string {
		const recommendations = this.explorationScratchpad.getExplorationRecommendations()
		const currentPhase = this.explorationScratchpad.getCurrentPhase()

		let output = `## Exploration Recommendations\n\n`
		output += `**Current Phase:** ${currentPhase}\n\n`

		if (recommendations.length > 0) {
			output += `### Recommended Actions:\n`
			recommendations.forEach((rec, index) => {
				output += `${index + 1}. ${rec}\n`
			})
		} else {
			output += `No specific recommendations. Exploration appears sufficient.`
		}

		output += `\n### Exploration Status:\n`
		const summary = this.explorationScratchpad.generateSummary()
		output += `- Entries: ${summary.totalEntries}\n`
		output += `- Confidence: ${(summary.confidenceScore * 100).toFixed(1)}%\n`
		output += `- Should Transition: ${this.explorationScratchpad.shouldTransitionToThinking() ? "Yes" : "No"}`

		return output
	}

	private truncateResult(result: any): string {
		const str = typeof result === "string" ? result : JSON.stringify(result)
		return str.length > 500 ? str.substring(0, 500) + "..." : str
	}

	private getThinkingHistory(): string {
		if (!this.thinkingEngine) {
			return "ThinkingEngine não disponível - funcionalidade limitada"
		}

		return this.thinkingEngine.formatThinkingHistory()
	}

	private async makeFinalDecision(): Promise<string> {
		if (!this.thinkingEngine) {
			return "ThinkingEngine não disponível - não é possível tomar decisão final"
		}

		try {
			const result = await this.thinkingEngine.makeFinalDecision()

			let output = `## Decisão Final Tomada\n\n`
			output += `**Decisão:** ${result.decision}\n\n`
			output += `**Confiança:** ${(result.confidence * 100).toFixed(1)}%\n\n`
			output += `**Raciocínio:** ${result.reasoning}\n\n`

			if (result.actionPlan.length > 0) {
				output += `### Plano de Ação:\n`
				result.actionPlan.forEach((action, index) => {
					output += `${index + 1}. ${action}\n`
				})
			}

			return output
		} catch (error) {
			return `Erro ao tomar decisão final: ${error}`
		}
	}

	private async executeIntelligentThinking(maxIterations: number): Promise<string> {
		if (!this.intelligentThinkingSystem) {
			return "Sistema de Pensamento Inteligente não disponível"
		}

		try {
			const result = await this.intelligentThinkingSystem.executeThinkingLoop(maxIterations)

			let output = `## Pensamento Inteligente Executado\n\n`
			output += `**Decisão:** ${result.finalDecision}\n\n`
			output += `**Confiança:** ${(result.confidence * 100).toFixed(1)}%\n\n`
			output += `**Pensamentos Processados:** ${result.thoughtProcess.length}\n\n`

			output += `### Processo de Pensamento:\n`
			result.thoughtProcess.forEach((thought: any, index: number) => {
				output += `${index + 1}. **[${thought.phase}]** ${thought.thought} (Confiança: ${(thought.confidence * 100).toFixed(1)}%)\n`
			})

			return output
		} catch (error) {
			return `Erro durante pensamento inteligente: ${error}`
		}
	}

	private getIntelligentThinkingHistory(): string {
		if (!this.intelligentThinkingSystem) {
			return "Sistema de Pensamento Inteligente não disponível"
		}

		return this.intelligentThinkingSystem.formatIntelligentThinkingHistory()
	}
}
