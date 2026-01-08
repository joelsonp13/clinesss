import { ToolResponse } from "../../index"
import { ExplorationScratchpad } from "./ExplorationScratchpad"
import { ThinkingEngine } from "./ThinkingEngine"

export interface IntelligentThought {
	id: string
	timestamp: number
	phase: "EXPLORE" | "THINK" | "EXECUTE" | "REFLECT"
	thought: string
	confidence: number
	evidence: string[]
	triggersAction: boolean
	actionType?: "tool_use" | "analysis" | "decision"
	actionParams?: any
	reflection?: string
}

export interface ConversationContext {
	taskDescription: string
	currentIteration: number
	totalIterations: number
	thoughtChain: IntelligentThought[]
	accumulatedKnowledge: Map<string, any>
	currentFocus: string
	lastActionResult?: ToolResponse
	convergenceLevel: number // 0-1, quanto o pensamento convergiu para uma solução
}

export class IntelligentThinkingSystem {
	private thoughtChain: IntelligentThought[] = []
	private conversationContext: ConversationContext
	private isThinkingActive = false
	private convergenceThreshold = 0.85

	constructor(
		private explorationScratchpad: ExplorationScratchpad,
		private thinkingEngine: ThinkingEngine,
	) {
		this.conversationContext = {
			taskDescription: "",
			currentIteration: 0,
			totalIterations: 0,
			thoughtChain: [],
			accumulatedKnowledge: new Map(),
			currentFocus: "task_understanding",
			convergenceLevel: 0,
		}
	}

	/**
	 * Inicia o processo de pensamento inteligente para uma tarefa
	 */
	public async initializeIntelligentThinking(taskDescription: string): Promise<void> {
		this.conversationContext.taskDescription = taskDescription
		this.conversationContext.currentIteration = 0
		this.isThinkingActive = true

		// Primeiro pensamento: entender a tarefa
		await this.addThought({
			phase: "THINK",
			thought: `Nova tarefa recebida: "${taskDescription}". Preciso entender profundamente o que está sendo pedido.`,
			confidence: 0.5,
			evidence: [],
			triggersAction: false,
		})

		// Segundo pensamento: avaliar conhecimento atual
		const currentKnowledge = this.explorationScratchpad.generateSummary()
		await this.addThought({
			phase: "THINK",
			thought: `Avaliando meu conhecimento atual: ${currentKnowledge.totalEntries} pontos de dados coletados, confiança de ${(currentKnowledge.confidenceScore * 100).toFixed(1)}%.`,
			confidence: currentKnowledge.confidenceScore,
			evidence: currentKnowledge.keyFindings,
			triggersAction: true,
			actionType: "analysis",
			actionParams: { type: "knowledge_assessment" },
		})
	}

	/**
	 * Loop principal de pensamento inteligente
	 * Funciona como uma conversa consigo mesmo: pensa → age → observa → pensa novamente
	 */
	public async executeThinkingLoop(maxIterations: number = 10): Promise<{
		finalDecision: string
		confidence: number
		thoughtProcess: IntelligentThought[]
	}> {
		this.conversationContext.totalIterations = maxIterations

		while (this.conversationContext.currentIteration < maxIterations && this.isThinkingActive) {
			this.conversationContext.currentIteration++

			try {
				// FASE 1: PENSAR - Analisar situação atual
				const currentAnalysis = await this.analyzeCurrentSituation()

				// FASE 2: EXPLORAR - Se precisar de mais informações
				if (currentAnalysis.needsMoreExploration && currentAnalysis.explorationStrategy) {
					await this.performIntelligentExploration(currentAnalysis.explorationStrategy)
					continue // Volta a pensar após exploração
				}

				// FASE 3: RACIOCINAR PROFUNDAMENTE - Se precisar de análise mais profunda
				if (currentAnalysis.needsDeepReasoning) {
					await this.performDeepReasoning()
					continue // Volta a pensar após raciocínio
				}

				// FASE 4: DECIDIR - Se tiver informações suficientes
				if (currentAnalysis.canMakeDecision) {
					const decision = await this.makeIntelligentDecision()
					this.isThinkingActive = false // Para o loop
					return decision
				}

				// FASE 5: REFLETIR - Sobre o que aconteceu na iteração anterior
				if (this.conversationContext.lastActionResult) {
					await this.reflectOnActionResult()
				}

				// Verificar convergência
				this.updateConvergenceLevel()
				if (this.conversationContext.convergenceLevel >= this.convergenceThreshold) {
					const decision = await this.makeIntelligentDecision()
					this.isThinkingActive = false
					return decision
				}
			} catch (error) {
				await this.handleThinkingError(error)
			}

			// Pequena pausa para simular pensamento
			await this.simulateThinkingPause(200)
		}

		// Forçar decisão se chegou ao limite de iterações
		const decision = await this.makeIntelligentDecision()
		this.isThinkingActive = false
		return decision
	}

	/**
	 * Adiciona um pensamento à cadeia de raciocínio
	 */
	private async addThought(thoughtData: Omit<IntelligentThought, "id" | "timestamp">): Promise<void> {
		const thought: IntelligentThought = {
			id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
			...thoughtData,
		}

		this.thoughtChain.push(thought)
		this.conversationContext.thoughtChain.push(thought)

		// Registrar pensamento interno
		console.log(
			`[INTELLIGENT_THINKING] ${thought.phase}:${thought.id} - ${thought.thought} (${(thought.confidence * 100).toFixed(1)}%)`,
		)

		// Atualizar foco baseado no pensamento
		this.updateFocusBasedOnThought(thought)
	}

	/**
	 * Analisa a situação atual e decide próximos passos
	 */
	private async analyzeCurrentSituation(): Promise<{
		needsMoreExploration: boolean
		needsDeepReasoning: boolean
		canMakeDecision: boolean
		explorationStrategy?: string[]
		reasoningFocus?: string
	}> {
		const summary = this.explorationScratchpad.generateSummary()
		const currentPhase = this.explorationScratchpad.getCurrentPhase()
		const iteration = this.conversationContext.currentIteration

		// Pensamento analítico
		const analysisThought = `Análise da iteração ${iteration}: ${summary.totalEntries} dados coletados, confiança ${(summary.confidenceScore * 100).toFixed(1)}%, fase ${currentPhase}.`

		// Decidir estratégia baseada na situação
		let needsMoreExploration = false
		let needsDeepReasoning = false
		let canMakeDecision = false
		let explorationStrategy: string[] = []
		let reasoningFocus = ""

		if (summary.totalEntries < 3 && currentPhase === "EXPLORE") {
			// Ainda precisa explorar mais
			needsMoreExploration = true
			explorationStrategy = ["auto_explore", "read_key_files", "search_patterns"]
			await this.addThought({
				phase: "THINK",
				thought: `${analysisThought} Ainda preciso explorar mais para entender o contexto.`,
				confidence: summary.confidenceScore,
				evidence: [`Poucos dados: ${summary.totalEntries} entradas`],
				triggersAction: true,
				actionType: "analysis",
				actionParams: { strategy: explorationStrategy },
			})
		} else if (summary.confidenceScore < 0.7 && currentPhase === "THINK") {
			// Precisa raciocinar mais profundamente
			needsDeepReasoning = true
			reasoningFocus = "evidence_evaluation"
			await this.addThought({
				phase: "THINK",
				thought: `${analysisThought} Confiança ainda baixa, preciso raciocinar mais profundamente.`,
				confidence: summary.confidenceScore,
				evidence: [`Confiança baixa: ${(summary.confidenceScore * 100).toFixed(1)}%`],
				triggersAction: true,
				actionType: "analysis",
				actionParams: { focus: reasoningFocus },
			})
		} else if (summary.confidenceScore >= 0.8 || iteration >= 5) {
			// Pode tomar decisão
			canMakeDecision = true
			await this.addThought({
				phase: "THINK",
				thought: `${analysisThought} Tenho informações suficientes para tomar uma decisão.`,
				confidence: summary.confidenceScore,
				evidence: [`Confiança adequada: ${(summary.confidenceScore * 100).toFixed(1)}%`, `Iteração ${iteration}`],
				triggersAction: false,
			})
		} else {
			// Continuar explorando de forma mais direcionada
			needsMoreExploration = true
			explorationStrategy = ["targeted_search", "deep_file_analysis"]
			await this.addThought({
				phase: "THINK",
				thought: `${analysisThought} Vou explorar de forma mais direcionada.`,
				confidence: summary.confidenceScore,
				evidence: [`Estratégia direcionada necessária`],
				triggersAction: true,
				actionType: "analysis",
				actionParams: { strategy: explorationStrategy },
			})
		}

		return {
			needsMoreExploration,
			needsDeepReasoning,
			canMakeDecision,
			explorationStrategy,
			reasoningFocus,
		}
	}

	/**
	 * Executa exploração inteligente baseada na estratégia definida
	 */
	private async performIntelligentExploration(strategy: string[]): Promise<void> {
		await this.addThought({
			phase: "EXPLORE",
			thought: `Iniciando exploração inteligente com estratégia: ${strategy.join(", ")}`,
			confidence: 0.7,
			evidence: [`Estratégia baseada na análise atual`],
			triggersAction: true,
			actionType: "tool_use",
			actionParams: { explorationStrategy: strategy },
		})

		// Aqui seria integrado com o ToolExecutor para executar as ferramentas
		// Por enquanto, apenas simulamos o pensamento
		for (const explorationType of strategy) {
			await this.addThought({
				phase: "EXPLORE",
				thought: `Executando exploração do tipo: ${explorationType}`,
				confidence: 0.8,
				evidence: [`Tipo de exploração: ${explorationType}`],
				triggersAction: false,
			})
		}

		await this.addThought({
			phase: "REFLECT",
			thought: `Exploração concluída. Agora vou analisar os novos dados coletados.`,
			confidence: 0.75,
			evidence: [`Dados de exploração processados`],
			triggersAction: false,
		})
	}

	/**
	 * Executa raciocínio profundo sobre os dados coletados
	 */
	private async performDeepReasoning(): Promise<void> {
		await this.addThought({
			phase: "THINK",
			thought: `Iniciando raciocínio profundo para analisar evidências e identificar padrões.`,
			confidence: 0.6,
			evidence: [`Dados disponíveis: ${this.explorationScratchpad.generateSummary().totalEntries} entradas`],
			triggersAction: true,
			actionType: "analysis",
			actionParams: { type: "deep_reasoning" },
		})

		// Usar o tough reasoning do ExplorationScratchpad
		const reasoningResult = await this.explorationScratchpad.toughReasoning(3, 0.8)

		await this.addThought({
			phase: "THINK",
			thought: `Raciocínio profundo concluído: ${reasoningResult.conclusion}`,
			confidence: reasoningResult.confidence,
			evidence: reasoningResult.reasoningSteps,
			triggersAction: false,
			reflection: `Confiança aumentou para ${(reasoningResult.confidence * 100).toFixed(1)}% após análise profunda.`,
		})
	}

	/**
	 * Toma decisão inteligente baseada em todo o processo de pensamento
	 */
	private async makeIntelligentDecision(): Promise<{
		finalDecision: string
		confidence: number
		thoughtProcess: IntelligentThought[]
	}> {
		await this.addThought({
			phase: "EXECUTE",
			thought: `Tomando decisão final baseada em ${this.thoughtChain.length} pensamentos e ${this.explorationScratchpad.generateSummary().totalEntries} dados.`,
			confidence: this.explorationScratchpad.generateSummary().confidenceScore,
			evidence: [`Pensamentos analisados: ${this.thoughtChain.length}`],
			triggersAction: false,
		})

		// Usar o thinking engine para decisão final
		const finalDecision = await this.thinkingEngine.makeFinalDecision()

		await this.addThought({
			phase: "EXECUTE",
			thought: `Decisão tomada: ${finalDecision.decision}`,
			confidence: finalDecision.confidence,
			evidence: [`Decisão final baseada em evidências`],
			triggersAction: false,
			reflection: `Processo de pensamento inteligente concluído após ${this.conversationContext.currentIteration} iterações.`,
		})

		return {
			finalDecision: finalDecision.decision,
			confidence: finalDecision.confidence,
			thoughtProcess: [...this.thoughtChain],
		}
	}

	/**
	 * Reflete sobre o resultado da última ação executada
	 */
	private async reflectOnActionResult(): Promise<void> {
		const lastResult = this.conversationContext.lastActionResult

		if (!lastResult) return

		const reflection = this.analyzeActionResult(lastResult)

		await this.addThought({
			phase: "REFLECT",
			thought: `Refletindo sobre resultado da ação: ${reflection.summary}`,
			confidence: reflection.confidence,
			evidence: reflection.evidence,
			triggersAction: reflection.suggestsNextAction,
			actionType: "analysis",
			actionParams: { reflection_type: "action_result" },
			reflection: reflection.insights,
		})

		// Limpar resultado após reflexão
		this.conversationContext.lastActionResult = undefined
	}

	/**
	 * Atualiza o nível de convergência do pensamento
	 */
	private updateConvergenceLevel(): void {
		const summary = this.explorationScratchpad.generateSummary()
		const iterations = this.conversationContext.currentIteration
		const thoughtConsistency = this.calculateThoughtConsistency()

		// Convergência baseada em: confiança dos dados + consistência do pensamento + iterações
		const dataConfidence = summary.confidenceScore
		const iterationBonus = Math.min(0.3, iterations * 0.05) // Até 30% de bônus por iterações
		const consistencyBonus = thoughtConsistency * 0.2 // Até 20% por consistência

		this.conversationContext.convergenceLevel = Math.min(1, dataConfidence + iterationBonus + consistencyBonus)
	}

	/**
	 * Calcula consistência do pensamento baseado na cadeia de pensamentos
	 */
	private calculateThoughtConsistency(): number {
		if (this.thoughtChain.length < 2) return 0.5

		// Análise simplificada: consistência baseada na variação de confiança
		const confidences = this.thoughtChain.map((t) => t.confidence)
		const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length
		const variance = confidences.reduce((sum, conf) => sum + (conf - avgConfidence) ** 2, 0) / confidences.length

		// Menor variância = maior consistência
		return Math.max(0, 1 - Math.sqrt(variance))
	}

	/**
	 * Atualiza o foco atual baseado no pensamento
	 */
	private updateFocusBasedOnThought(thought: IntelligentThought): void {
		switch (thought.phase) {
			case "EXPLORE":
				this.conversationContext.currentFocus = "data_collection"
				break
			case "THINK":
				this.conversationContext.currentFocus = "analysis"
				break
			case "EXECUTE":
				this.conversationContext.currentFocus = "decision_making"
				break
			case "REFLECT":
				this.conversationContext.currentFocus = "learning"
				break
		}
	}

	/**
	 * Trata erros durante o processo de pensamento
	 */
	private async handleThinkingError(error: any): Promise<void> {
		await this.addThought({
			phase: "REFLECT",
			thought: `Erro durante pensamento: ${error.message}. Vou ajustar abordagem.`,
			confidence: 0.3,
			evidence: [`Erro: ${error.message}`],
			triggersAction: true,
			actionType: "analysis",
			actionParams: { type: "error_recovery" },
		})
	}

	/**
	 * Simula pausa de pensamento
	 */
	private async simulateThinkingPause(ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, ms))
	}

	/**
	 * Analisa resultado de uma ação
	 */
	private analyzeActionResult(result: ToolResponse): {
		summary: string
		confidence: number
		evidence: string[]
		suggestsNextAction: boolean
		insights: string
	} {
		const resultStr = typeof result === "string" ? result : JSON.stringify(result)

		let summary = "Resultado processado"
		let confidence = 0.7
		let evidence: string[] = []
		let suggestsNextAction = false
		let insights = ""

		if (resultStr.includes("error") || resultStr.includes("not found")) {
			summary = "Resultado indica problema ou ausência"
			confidence = 0.4
			evidence = ["Resultado contém erros"]
			suggestsNextAction = true
			insights = "Preciso investigar mais ou ajustar abordagem"
		} else if (resultStr.length > 200) {
			summary = "Resultado rico em informações"
			confidence = 0.9
			evidence = ["Resultado extenso e informativo"]
			suggestsNextAction = false
			insights = "Dados suficientes coletados, posso prosseguir"
		} else {
			summary = "Resultado básico obtido"
			confidence = 0.6
			evidence = ["Resultado padrão"]
			suggestsNextAction = true
			insights = "Posso precisar de mais informações específicas"
		}

		return { summary, confidence, evidence, suggestsNextAction, insights }
	}

	/**
	 * Registra resultado de ação para reflexão futura
	 */
	public registerActionResult(result: ToolResponse): void {
		this.conversationContext.lastActionResult = result
	}

	/**
	 * Obtém o histórico completo de pensamento inteligente
	 */
	public getIntelligentThoughtHistory(): IntelligentThought[] {
		return [...this.thoughtChain]
	}

	/**
	 * Formata o histórico de pensamento para display
	 */
	public formatIntelligentThinkingHistory(): string {
		let output = `## Histórico de Pensamento Inteligente\n\n`
		output += `**Tarefa:** ${this.conversationContext.taskDescription}\n`
		output += `**Iterações:** ${this.conversationContext.currentIteration}/${this.conversationContext.totalIterations}\n`
		output += `**Convergência:** ${(this.conversationContext.convergenceLevel * 100).toFixed(1)}%\n`
		output += `**Foco Atual:** ${this.conversationContext.currentFocus}\n\n`

		const thoughtsByPhase = this.thoughtChain.reduce(
			(groups, thought) => {
				if (!groups[thought.phase]) groups[thought.phase] = []
				groups[thought.phase].push(thought)
				return groups
			},
			{} as Record<string, IntelligentThought[]>,
		)

		for (const phase of ["THINK", "EXPLORE", "REFLECT", "EXECUTE"]) {
			const thoughts = thoughtsByPhase[phase] || []
			if (thoughts.length > 0) {
				output += `### Fase ${phase} (${thoughts.length} pensamentos)\n\n`
				thoughts.forEach((thought, index) => {
					const time = new Date(thought.timestamp).toLocaleTimeString()
					output += `**${index + 1}. ${thought.id}** (${time})\n`
					output += `Pensamento: ${thought.thought}\n`
					output += `Confiança: ${(thought.confidence * 100).toFixed(1)}%\n`
					if (thought.evidence.length > 0) {
						output += `Evidências: ${thought.evidence.join(", ")}\n`
					}
					if (thought.reflection) {
						output += `Reflexão: ${thought.reflection}\n`
					}
					if (thought.triggersAction) {
						output += `Aciona ação: ${thought.actionType}\n`
					}
					output += "\n"
				})
			}
		}

		return output
	}

	/**
	 * Obtém o contexto atual da conversa
	 */
	public getConversationContext(): ConversationContext {
		return { ...this.conversationContext }
	}

	/**
	 * Para o processo de pensamento
	 */
	public stopThinking(): void {
		this.isThinkingActive = false
	}

	/**
	 * Verifica se o pensamento ainda está ativo
	 */
	public isThinking(): boolean {
		return this.isThinkingActive
	}
}
