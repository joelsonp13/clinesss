import { ClineDefaultTool } from "@shared/tools"
import { ToolResponse } from "../../index"
import { ExplorationEntry, ExplorationScratchpad } from "./ExplorationScratchpad"

export interface ThinkingStep {
	timestamp: number
	phase: "EXPLORE" | "THINK" | "EXECUTE"
	action: string
	reasoning: string
	confidence: number
	evidence: string[]
	nextActions: string[]
}

export interface DecisionContext {
	task: string
	currentPhase: "EXPLORE" | "THINK" | "EXECUTE"
	availableEvidence: ExplorationEntry[]
	confidence: number
	timeSpent: number
	previousDecisions: ThinkingStep[]
}

export class ThinkingEngine {
	private thinkingSteps: ThinkingStep[] = []
	private startTime: number = Date.now()
	private currentTask: string = ""

	constructor(private explorationScratchpad: ExplorationScratchpad) {
		this.startTime = Date.now()
	}

	/**
	 * Inicia o processo de pensamento para uma nova tarefa
	 */
	public async initializeTask(task: string): Promise<void> {
		this.currentTask = task
		this.startTime = Date.now()
		this.thinkingSteps = []

		// Primeiro pensamento: avaliar o que sabemos
		await this.addThinkingStep(
			"EXPLORE",
			"task_received",
			`Nova tarefa recebida: "${task}". Preciso avaliar meu conhecimento atual.`,
			0.5,
			[],
			[
				"Verificar se já tenho dados relevantes no scratchpad",
				"Determinar estratégia inicial de exploração",
				"Avaliar complexidade da tarefa",
			],
		)

		// Verificação obrigatória: temos dados suficientes?
		const summary = this.explorationScratchpad.generateSummary()
		if (summary.totalEntries === 0) {
			await this.addThinkingStep(
				"EXPLORE",
				"no_prior_knowledge",
				"Não tenho conhecimento prévio desta tarefa. Devo iniciar exploração sistemática.",
				0.3,
				[],
				[
					"Executar auto-exploração para entender contexto",
					"Ler arquivos de configuração principais",
					"Mapear estrutura do projeto",
				],
			)
		}
	}

	/**
	 * Processo obrigatório antes de executar qualquer ferramenta
	 */
	public async thinkBeforeAction(
		toolName: ClineDefaultTool,
		params: any,
	): Promise<{
		shouldProceed: boolean
		reasoning: string
		confidence: number
	}> {
		const currentPhase = this.explorationScratchpad.getCurrentPhase()
		const summary = this.explorationScratchpad.generateSummary()

		// Verificação 1: Cache inteligente - já fiz isso antes?
		const query = this.extractQueryFromTool(toolName, params)
		const hasCached = this.explorationScratchpad.hasExplored(toolName, query, params.path)

		if (hasCached) {
			const cachedResult = this.explorationScratchpad.getCachedResult(toolName, query, params.path)
			await this.addThinkingStep(
				currentPhase,
				"cache_check",
				`Já executei ${toolName} com parâmetros similares. Usarei resultado cacheado para eficiência.`,
				0.9,
				[
					`Resultado anterior: ${this.truncateResult(cachedResult?.result)}`,
					`Confiança do cache: ${(cachedResult?.confidence || 0) * 100}%`,
				],
				[],
			)
			return {
				shouldProceed: false,
				reasoning: "Resultado cacheado disponível",
				confidence: cachedResult?.confidence || 0.8,
			}
		}

		// Verificação 2: Esta ferramenta faz sentido no contexto atual?
		const toolRelevance = this.evaluateToolRelevance(toolName, currentPhase, summary)

		// Verificação 3: Tenho dados suficientes para esta ação?
		const sufficientEvidence = this.hasSufficientEvidenceForAction(toolName, summary)

		const reasoning = this.buildActionReasoning(toolName, params, toolRelevance, sufficientEvidence, currentPhase)
		const confidence = this.calculateActionConfidence(toolRelevance, sufficientEvidence, summary.confidenceScore)

		await this.addThinkingStep(
			currentPhase,
			"tool_evaluation",
			reasoning,
			confidence,
			[
				`Ferramenta: ${toolName}`,
				`Relevância: ${toolRelevance > 0.7 ? "Alta" : toolRelevance > 0.5 ? "Média" : "Baixa"}`,
				`Evidências suficientes: ${sufficientEvidence ? "Sim" : "Não"}`,
				`Fase atual: ${currentPhase}`,
			],
			[],
		)

		const shouldProceed = confidence > 0.6
		return { shouldProceed, reasoning, confidence }
	}

	/**
	 * Análise obrigatória após resultado de ferramenta
	 */
	public async analyzeResult(
		toolName: ClineDefaultTool,
		params: any,
		result: ToolResponse,
	): Promise<{
		insights: string[]
		shouldTransition: boolean
		nextActions: string[]
	}> {
		const currentPhase = this.explorationScratchpad.getCurrentPhase()
		const summary = this.explorationScratchpad.generateSummary()

		// Armazenar resultado no scratchpad
		this.explorationScratchpad.addEntry({
			toolName,
			query: this.extractQueryFromTool(toolName, params),
			result,
			confidence: this.calculateResultConfidence(result),
			tags: this.generateResultTags(toolName, params),
			filePath: params.path,
			relevance: 1.0,
			toolParams: params,
		})

		// Análise do resultado
		const insights = await this.extractInsightsFromResult(toolName, result, params)

		// Avaliar se devemos transitar de fase
		const shouldTransition = this.shouldTransitionPhase(currentPhase, summary)

		// Sugerir próximas ações
		const nextActions = this.suggestNextActions(currentPhase, insights, summary, shouldTransition)

		const reasoning = `Analisei resultado de ${toolName}. ${insights.length} insights extraídos. ${
			shouldTransition ? "Pronto para transitar de fase." : "Continuando na fase atual."
		}`

		await this.addThinkingStep(currentPhase, "result_analysis", reasoning, summary.confidenceScore, insights, nextActions)

		return { insights, shouldTransition, nextActions }
	}

	/**
	 * Processo de tomada de decisão final
	 */
	public async makeFinalDecision(): Promise<{
		decision: string
		confidence: number
		actionPlan: string[]
		reasoning: string
	}> {
		const summary = this.explorationScratchpad.generateSummary()

		// Forçar tough reasoning se confiança for baixa
		if (summary.confidenceScore < 0.8) {
			const toughResult = await this.explorationScratchpad.toughReasoning(5, 0.85)
			await this.addThinkingStep(
				"THINK",
				"tough_reasoning",
				`Executei raciocínio profundo: ${toughResult.conclusion}`,
				toughResult.confidence,
				[`Iterações: ${toughResult.iterations}`, `Passos de raciocínio: ${toughResult.reasoningSteps.length}`],
				[],
			)
		}

		// Gerar decisão final
		const decisionContext = this.buildDecisionContext()
		const { decision, confidence, actionPlan } = await this.generateFinalDecision(decisionContext)

		const reasoning = `Com base em ${summary.totalEntries} pontos de evidência e confiança de ${(summary.confidenceScore * 100).toFixed(1)}%, decidi: ${decision}`

		await this.addThinkingStep(
			"EXECUTE",
			"final_decision",
			reasoning,
			confidence,
			[
				`Evidências totais: ${summary.totalEntries}`,
				`Arquivos explorados: ${summary.filesExplored}`,
				`Descobertas chave: ${summary.keyFindings.length}`,
			],
			actionPlan,
		)

		return { decision, confidence, actionPlan, reasoning }
	}

	/**
	 * Obtém histórico completo de pensamento
	 */
	public getThinkingHistory(): ThinkingStep[] {
		return [...this.thinkingSteps]
	}

	/**
	 * Formata histórico de pensamento para display
	 */
	public formatThinkingHistory(): string {
		let output = `## Histórico de Pensamento (${this.thinkingSteps.length} passos)\n\n`

		const phaseGroups = this.thinkingSteps.reduce(
			(groups, step) => {
				if (!groups[step.phase]) groups[step.phase] = []
				groups[step.phase].push(step)
				return groups
			},
			{} as Record<string, ThinkingStep[]>,
		)

		for (const phase of ["EXPLORE", "THINK", "EXECUTE"]) {
			const steps = phaseGroups[phase] || []
			if (steps.length > 0) {
				output += `### Fase ${phase} (${steps.length} passos)\n\n`
				steps.forEach((step, index) => {
					const time = new Date(step.timestamp).toLocaleTimeString()
					output += `**${index + 1}. ${step.action}** (${time})\n`
					output += `Confiança: ${(step.confidence * 100).toFixed(1)}%\n`
					output += `Pensamento: ${step.reasoning}\n`
					if (step.evidence.length > 0) {
						output += `Evidências: ${step.evidence.join(", ")}\n`
					}
					if (step.nextActions.length > 0) {
						output += `Próximas ações: ${step.nextActions.join(", ")}\n`
					}
					output += "\n"
				})
			}
		}

		return output
	}

	// Métodos privados auxiliares

	private async addThinkingStep(
		phase: "EXPLORE" | "THINK" | "EXECUTE",
		action: string,
		reasoning: string,
		confidence: number,
		evidence: string[],
		nextActions: string[],
	): Promise<void> {
		const step: ThinkingStep = {
			timestamp: Date.now(),
			phase,
			action,
			reasoning,
			confidence,
			evidence,
			nextActions,
		}

		this.thinkingSteps.push(step)

		// Log interno (opcional - pode ser removido em produção)
		console.log(`[THINKING] ${phase}:${action} - ${reasoning} (${(confidence * 100).toFixed(1)}%)`)
	}

	private extractQueryFromTool(toolName: ClineDefaultTool, params: any): string {
		switch (toolName) {
			case ClineDefaultTool.SEARCH:
				return params.regex || params.query || ""
			case ClineDefaultTool.FILE_READ:
				return params.path || ""
			case ClineDefaultTool.LIST_FILES:
				return params.path || ""
			default:
				return JSON.stringify(params)
		}
	}

	private evaluateToolRelevance(toolName: ClineDefaultTool, currentPhase: string, summary: any): number {
		// Ferramentas de exploração são sempre relevantes na fase EXPLORE
		if (
			currentPhase === "EXPLORE" &&
			[ClineDefaultTool.SEARCH, ClineDefaultTool.FILE_READ, ClineDefaultTool.LIST_FILES].includes(toolName)
		) {
			return 0.9
		}

		// Ferramentas de modificação só são relevantes na fase EXECUTE
		if (currentPhase === "EXECUTE" && [ClineDefaultTool.FILE_EDIT, ClineDefaultTool.FILE_NEW].includes(toolName)) {
			return summary.confidenceScore > 0.7 ? 0.9 : 0.5
		}

		// Reasoning tools são sempre relevantes
		if (toolName === ClineDefaultTool.REASONING) {
			return 0.95
		}

		return 0.6 // Relevância neutra
	}

	private hasSufficientEvidenceForAction(toolName: ClineDefaultTool, summary: any): boolean {
		// Para ferramentas de exploração, sempre temos evidências suficientes
		if ([ClineDefaultTool.SEARCH, ClineDefaultTool.FILE_READ, ClineDefaultTool.LIST_FILES].includes(toolName)) {
			return true
		}

		// Para ferramentas de modificação, precisamos de confiança alta
		if ([ClineDefaultTool.FILE_EDIT, ClineDefaultTool.FILE_NEW].includes(toolName)) {
			return summary.confidenceScore > 0.8 && summary.totalEntries > 5
		}

		return summary.totalEntries > 0
	}

	private buildActionReasoning(
		toolName: ClineDefaultTool,
		params: any,
		relevance: number,
		sufficientEvidence: boolean,
		currentPhase: string,
	): string {
		let reasoning = `Avaliando execução de ${toolName}`

		if (relevance > 0.8) {
			reasoning += " - ferramenta altamente relevante para fase atual"
		} else if (relevance < 0.5) {
			reasoning += " - ferramenta tem baixa relevância, mas pode ser necessária"
		}

		if (!sufficientEvidence) {
			reasoning += ". Atenção: evidências podem ser insuficientes para ação decisiva"
		}

		reasoning += `. Fase atual: ${currentPhase}`

		return reasoning
	}

	private calculateActionConfidence(toolRelevance: number, sufficientEvidence: boolean, scratchpadConfidence: number): number {
		let confidence = (toolRelevance + scratchpadConfidence) / 2
		if (!sufficientEvidence) confidence *= 0.8
		return Math.min(1.0, confidence)
	}

	private calculateResultConfidence(result: ToolResponse): number {
		if (typeof result === "string") {
			if (result.includes("error") || result.includes("not found")) return 0.3
			if (result.length > 100) return 0.9
			return 0.7
		}
		return 0.8
	}

	private generateResultTags(toolName: ClineDefaultTool, params: any): string[] {
		const tags: string[] = [toolName]

		if (params.path) tags.push("file_specific")
		if (toolName === ClineDefaultTool.SEARCH) tags.push("search", "discovery")
		if (toolName === ClineDefaultTool.FILE_READ) tags.push("content_analysis")
		if (toolName === ClineDefaultTool.LIST_FILES) tags.push("structure_mapping")

		return tags
	}

	private async extractInsightsFromResult(toolName: ClineDefaultTool, result: ToolResponse, params: any): Promise<string[]> {
		const insights: string[] = []

		if (typeof result === "string") {
			// Análise básica do resultado
			if (result.includes("package.json")) insights.push("Encontrado arquivo de configuração principal")
			if (result.includes("src/") || result.includes("lib/")) insights.push("Identificada estrutura de código fonte")
			if (result.includes("error") || result.includes("not found"))
				insights.push("Resultado indica possível problema ou ausência")
			if (result.length > 500) insights.push("Resultado rico em informações")
		}

		return insights.length > 0 ? insights : ["Resultado processado sem insights específicos"]
	}

	private shouldTransitionPhase(currentPhase: string, summary: any): boolean {
		switch (currentPhase) {
			case "EXPLORE":
				return summary.totalEntries >= 5 && summary.confidenceScore > 0.7
			case "THINK":
				return summary.confidenceScore > 0.85
			case "EXECUTE":
				return false // EXECUTE é fase final
			default:
				return false
		}
	}

	private suggestNextActions(currentPhase: string, insights: string[], summary: any, shouldTransition: boolean): string[] {
		const actions: string[] = []

		if (shouldTransition) {
			switch (currentPhase) {
				case "EXPLORE":
					actions.push("Transitar para THINK - analisar dados coletados")
					actions.push("Usar exploration_summary() para síntese")
					break
				case "THINK":
					actions.push("Transitar para EXECUTE - implementar solução")
					actions.push("Criar plano de ação baseado em evidências")
					break
			}
		} else {
			switch (currentPhase) {
				case "EXPLORE":
					if (summary.filesExplored === 0) actions.push("Explorar arquivos de configuração principais")
					if (summary.searchQueries === 0) actions.push("Realizar buscas por funcionalidades chave")
					break
				case "THINK":
					actions.push("Continuar análise - executar tough_reasoning()")
					break
				case "EXECUTE":
					actions.push("Implementar mudanças planejadas")
					break
			}
		}

		return actions
	}

	private buildDecisionContext(): DecisionContext {
		return {
			task: this.currentTask,
			currentPhase: this.explorationScratchpad.getCurrentPhase(),
			availableEvidence: this.explorationScratchpad.getEntries(),
			confidence: this.explorationScratchpad.generateSummary().confidenceScore,
			timeSpent: Date.now() - this.startTime,
			previousDecisions: [...this.thinkingSteps],
		}
	}

	private async generateFinalDecision(context: DecisionContext): Promise<{
		decision: string
		confidence: number
		actionPlan: string[]
	}> {
		const summary = this.explorationScratchpad.generateSummary()

		// Lógica simplificada de decisão - pode ser expandida
		let decision = "Implementar solução baseada em evidências coletadas"
		let actionPlan: string[] = []

		if (summary.confidenceScore > 0.9) {
			decision = "Solução clara identificada com alta confiança"
			actionPlan = ["Executar mudanças necessárias", "Validar implementação", "Testar funcionalidade"]
		} else if (summary.confidenceScore > 0.7) {
			decision = "Solução identificada com confiança moderada"
			actionPlan = ["Implementar solução proposta", "Verificar se resolve o problema", "Preparar ajustes se necessário"]
		} else {
			decision = "Mais análise necessária antes de decisão final"
			actionPlan = ["Continuar exploração", "Coletar mais evidências", "Reavaliar abordagem"]
		}

		return {
			decision,
			confidence: summary.confidenceScore,
			actionPlan,
		}
	}

	private truncateResult(result: any): string {
		const str = typeof result === "string" ? result : JSON.stringify(result)
		return str.length > 100 ? str.substring(0, 100) + "..." : str
	}
}
