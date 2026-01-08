import { ClineDefaultTool } from "@shared/tools"
import { ToolResponse } from "../../index"

export interface ExplorationEntry {
	toolName: ClineDefaultTool
	query: string
	result: ToolResponse
	confidence: number
	tags: string[]
	filePath?: string
	timestamp: number
	relevance: number
	toolParams: any
}

export interface ExplorationSummary {
	totalEntries: number
	filesExplored: number
	searchQueries: number
	listOperations: number
	keyFindings: string[]
	confidenceScore: number
}

export class ExplorationScratchpad {
	private entries: ExplorationEntry[] = []
	private cache: Map<string, ExplorationEntry> = new Map()
	private currentPhase: "EXPLORE" | "THINK" | "EXECUTE" = "EXPLORE"
	private explorationStartTime: number = Date.now()

	constructor() {
		this.explorationStartTime = Date.now()
	}

	/**
	 * Add an exploration entry to the scratchpad
	 */
	public addEntry(entry: Omit<ExplorationEntry, "timestamp">): void {
		const timestamp = Date.now()
		const fullEntry: ExplorationEntry = {
			...entry,
			timestamp,
		}

		// Add to main entries
		this.entries.push(fullEntry)

		// Add to cache with unique key
		const cacheKey = this.generateCacheKey(entry.toolName, entry.query, entry.filePath)
		this.cache.set(cacheKey, fullEntry)

		// Sort entries by timestamp (newest first)
		this.entries.sort((a, b) => b.timestamp - a.timestamp)
	}

	/**
	 * Check if a similar exploration has been done before
	 */
	public hasExplored(toolName: ClineDefaultTool, query: string, filePath?: string): boolean {
		const cacheKey = this.generateCacheKey(toolName, query, filePath)
		return this.cache.has(cacheKey)
	}

	/**
	 * Get cached result if available
	 */
	public getCachedResult(toolName: ClineDefaultTool, query: string, filePath?: string): ExplorationEntry | undefined {
		const cacheKey = this.generateCacheKey(toolName, query, filePath)
		return this.cache.get(cacheKey)
	}

	/**
	 * Get all entries filtered by criteria
	 */
	public getEntries(filter?: {
		toolName?: ClineDefaultTool
		filePath?: string
		tags?: string[]
		minConfidence?: number
	}): ExplorationEntry[] {
		let filtered = [...this.entries]

		if (filter) {
			if (filter.toolName) {
				filtered = filtered.filter((entry) => entry.toolName === filter.toolName)
			}
			if (filter.filePath) {
				filtered = filtered.filter((entry) => entry.filePath === filter.filePath)
			}
			if (filter.tags && filter.tags.length > 0) {
				filtered = filtered.filter((entry) => filter.tags!.some((tag) => entry.tags.includes(tag)))
			}
			if (filter.minConfidence !== undefined) {
				filtered = filtered.filter((entry) => entry.confidence >= filter.minConfidence!)
			}
		}

		return filtered
	}

	/**
	 * Generate a summary of exploration activities
	 */
	public generateSummary(): ExplorationSummary {
		const filesExplored = this.entries.filter(
			(entry) => entry.toolName === ClineDefaultTool.FILE_READ || entry.toolName === ClineDefaultTool.LIST_FILES,
		).length

		const searchQueries = this.entries.filter((entry) => entry.toolName === ClineDefaultTool.SEARCH).length

		const listOperations = this.entries.filter((entry) => entry.toolName === ClineDefaultTool.LIST_FILES).length

		// Extract key findings from high-confidence entries
		const highConfidenceEntries = this.entries.filter((entry) => entry.confidence > 0.8)
		const keyFindings = highConfidenceEntries.map((entry) => {
			if (typeof entry.result === "string") {
				return entry.result.substring(0, 100) + "..."
			} else if (entry.result && typeof entry.result === "object" && "content" in entry.result) {
				return String(entry.result.content).substring(0, 100) + "..."
			}
			return `Explored ${entry.toolName} for ${entry.query}`
		})

		// Calculate average confidence
		const totalConfidence = this.entries.reduce((sum, entry) => sum + entry.confidence, 0)
		const confidenceScore = this.entries.length > 0 ? totalConfidence / this.entries.length : 0

		return {
			totalEntries: this.entries.length,
			filesExplored,
			searchQueries,
			listOperations,
			keyFindings,
			confidenceScore,
		}
	}

	/**
	 * Perform tough reasoning analysis with iterative refinement
	 */
	public async toughReasoning(
		maxIterations: number = 5,
		minConfidence: number = 0.85,
	): Promise<{
		conclusion: string
		confidence: number
		iterations: number
		reasoningSteps: string[]
	}> {
		let currentConfidence = 0
		let iterations = 0
		let conclusion = "Insufficient data for conclusion"
		const reasoningSteps: string[] = []

		for (iterations = 1; iterations <= maxIterations; iterations++) {
			const summary = this.generateSummary()
			reasoningSteps.push(`Iteration ${iterations}: Analyzing ${summary.totalEntries} exploration entries`)

			// Analyze different aspects in each iteration
			switch (iterations) {
				case 1:
					// First iteration: Basic problem identification
					reasoningSteps.push(`  - Problem scope: ${this.identifyProblemScope(summary)}`)
					break
				case 2:
					// Second iteration: Evidence evaluation
					reasoningSteps.push(`  - Evidence quality: ${this.evaluateEvidenceQuality(summary)}`)
					break
				case 3:
					// Third iteration: Pattern recognition
					reasoningSteps.push(`  - Patterns identified: ${this.identifyPatterns()}`)
					break
				default:
					// Later iterations: Deep analysis
					reasoningSteps.push(`  - Deep analysis: ${this.performDeepAnalysis(summary)}`)
					break
			}

			// Calculate confidence with more sophisticated metrics
			currentConfidence = this.calculateSophisticatedConfidence(summary, iterations)

			if (currentConfidence >= minConfidence) {
				conclusion = this.generateDetailedConclusion(summary, reasoningSteps)
				reasoningSteps.push(`  - Final conclusion reached with ${Math.round(currentConfidence * 100)}% confidence`)
				break
			}

			// Brief pause for "thinking"
			await new Promise((resolve) => setTimeout(resolve, 150))
		}

		return {
			conclusion,
			confidence: currentConfidence,
			iterations,
			reasoningSteps,
		}
	}

	/**
	 * Check if we should perform auto-exploration at the start
	 */
	public shouldPerformAutoExploration(): boolean {
		return this.entries.length === 0 && this.currentPhase === "EXPLORE"
	}

	/**
	 * Get exploration recommendations based on current state
	 */
	public getExplorationRecommendations(): string[] {
		const recommendations: string[] = []
		const summary = this.generateSummary()

		if (summary.totalEntries === 0) {
			recommendations.push("Start with list_files to understand project structure")
			recommendations.push("Use read_file on key configuration files (package.json, README, etc.)")
		}

		if (summary.filesExplored === 0) {
			recommendations.push("Explore source code directories to understand the codebase")
		}

		if (summary.searchQueries === 0) {
			recommendations.push("Perform targeted searches for key functionality")
		}

		if (summary.confidenceScore < 0.6) {
			recommendations.push("Gather more evidence before proceeding to analysis")
		}

		return recommendations
	}

	/**
	 * Determine if we have sufficient exploration for thinking phase
	 */
	public shouldTransitionToThinking(): boolean {
		return this.hasSufficientExploration(2, 0.6) || this.getExplorationDuration() > 30000 // 30 seconds of exploration
	}

	/**
	 * Internal helper methods for reasoning
	 */
	private identifyProblemScope(summary: ExplorationSummary): string {
		if (summary.totalEntries < 2) return "Too early to determine scope"
		return `Exploring ${summary.filesExplored} files with ${summary.searchQueries} searches`
	}

	private evaluateEvidenceQuality(summary: ExplorationSummary): string {
		const quality = summary.confidenceScore > 0.8 ? "High" : summary.confidenceScore > 0.6 ? "Medium" : "Low"
		return `${quality} quality (${Math.round(summary.confidenceScore * 100)}% confidence)`
	}

	private identifyPatterns(): string {
		// Simple pattern detection based on tool usage
		const fileReads = this.entries.filter((e) => e.toolName === "read_file").length
		const searches = this.entries.filter((e) => e.toolName === "search_files").length
		const lists = this.entries.filter((e) => e.toolName === "list_files").length

		if (fileReads > searches + lists) return "Code-focused exploration"
		if (searches > fileReads + lists) return "Search-driven investigation"
		if (lists > fileReads + searches) return "Structure mapping"
		return "Balanced exploration approach"
	}

	private performDeepAnalysis(summary: ExplorationSummary): string {
		const duration = this.getExplorationDuration()
		const efficiency = summary.totalEntries / Math.max(duration / 1000, 1)
		return `Analysis efficiency: ${efficiency.toFixed(2)} actions/second`
	}

	private calculateSophisticatedConfidence(summary: ExplorationSummary, iterations: number): number {
		// More sophisticated confidence calculation
		const baseConfidence = summary.confidenceScore
		const explorationDepth = Math.min(1, summary.totalEntries / 10) // Cap at 10 entries
		const iterationBonus = Math.min(0.2, iterations * 0.05) // Up to 20% bonus for iterations
		const timeBonus = Math.min(0.1, this.getExplorationDuration() / 60000) // Up to 10% for time spent

		return Math.min(1, baseConfidence * explorationDepth + iterationBonus + timeBonus)
	}

	private generateDetailedConclusion(summary: ExplorationSummary, reasoningSteps: string[]): string {
		const conclusion = this.generateConclusion(summary)
		const patterns = this.identifyPatterns()
		const evidenceQuality = this.evaluateEvidenceQuality(summary)

		return `${conclusion}\n\nAnalysis Summary:
- Evidence Quality: ${evidenceQuality}
- Exploration Pattern: ${patterns}
- Reasoning Iterations: ${reasoningSteps.length}
- Total Data Points: ${summary.totalEntries}`
	}

	/**
	 * Transition to the next phase
	 */
	public transitionToNextPhase(): void {
		switch (this.currentPhase) {
			case "EXPLORE":
				this.currentPhase = "THINK"
				break
			case "THINK":
				this.currentPhase = "EXECUTE"
				break
			case "EXECUTE":
				// Stay in execute phase
				break
		}
	}

	/**
	 * Get current phase
	 */
	public getCurrentPhase(): "EXPLORE" | "THINK" | "EXECUTE" {
		return this.currentPhase
	}

	/**
	 * Reset scratchpad for new exploration
	 */
	public reset(): void {
		this.entries = []
		this.cache.clear()
		this.currentPhase = "EXPLORE"
		this.explorationStartTime = Date.now()
	}

	/**
	 * Get exploration duration
	 */
	public getExplorationDuration(): number {
		return Date.now() - this.explorationStartTime
	}

	/**
	 * Generate cache key for exploration entries
	 */
	private generateCacheKey(toolName: ClineDefaultTool, query: string, filePath?: string): string {
		let baseKey = `${toolName}:${query}`
		if (filePath) {
			baseKey += `:${filePath}`
		}
		return baseKey.toLowerCase()
	}

	/**
	 * Generate conclusion based on exploration summary
	 */
	private generateConclusion(summary: ExplorationSummary): string {
		if (summary.totalEntries === 0) {
			return "No exploration data available"
		}

		const findings = [
			`Explored ${summary.totalEntries} items`,
			`Found ${summary.filesExplored} relevant files`,
			`Performed ${summary.searchQueries} search queries`,
			`Overall confidence: ${(summary.confidenceScore * 100).toFixed(1)}%`,
		]

		if (summary.keyFindings.length > 0) {
			findings.push(`Key findings: ${summary.keyFindings.slice(0, 3).join(", ")}`)
		}

		return findings.join(". ") + ". Ready to proceed with execution."
	}

	/**
	 * Create a formatted exploration summary for display
	 */
	public formatExplorationSummaryForDisplay(): string {
		const summary = this.generateSummary()
		const durationMinutes = Math.floor(this.getExplorationDuration() / 60000)
		const durationSeconds = Math.floor((this.getExplorationDuration() % 60000) / 1000)

		return `## Exploration Summary
- **Phase**: ${this.currentPhase}
- **Duration**: ${durationMinutes}m ${durationSeconds}s
- **Total Explorations**: ${summary.totalEntries}
- **Files Explored**: ${summary.filesExplored}
- **Search Queries**: ${summary.searchQueries}
- **List Operations**: ${summary.listOperations}
- **Confidence Score**: ${(summary.confidenceScore * 100).toFixed(1)}%
- **Key Findings**: ${summary.keyFindings.length > 0 ? summary.keyFindings.join(", ") : "None"}

${this.currentPhase === "EXPLORE" ? "Continue exploring..." : "Ready for analysis..."}`
	}

	/**
	 * Check if sufficient exploration has been done
	 */
	public hasSufficientExploration(minEntries: number = 3, minConfidence: number = 0.7): boolean {
		const summary = this.generateSummary()
		return this.entries.length >= minEntries && summary.confidenceScore >= minConfidence
	}
}
