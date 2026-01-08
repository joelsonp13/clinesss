import { ExplorationScratchpad } from "../ExplorationScratchpad"
import { IntelligentThinkingSystem } from "../IntelligentThinkingSystem"
import { ThinkingEngine } from "../ThinkingEngine"

/**
 * Exemplo de uso do Sistema de Pensamento Inteligente
 *
 * Este exemplo demonstra como o sistema funciona como uma conversa interna:
 * 1. O AI pensa sobre a tarefa
 * 2. Explora dados necessários
 * 3. Pensa sobre os dados coletados
 * 4. Toma decisões
 * 5. Executa ações
 * 6. Reflete sobre os resultados
 * 7. Volta a pensar se necessário
 */
export class IntelligentThinkingExample {
	/**
	 * Exemplo completo de pensamento inteligente para implementar autenticação OAuth
	 */
	public static async demonstrateIntelligentThinking(): Promise<void> {
		console.log("=== Demonstração do Sistema de Pensamento Inteligente ===\n")

		// Inicializar componentes
		const explorationScratchpad = new ExplorationScratchpad()
		const thinkingEngine = new ThinkingEngine(explorationScratchpad)
		const intelligentSystem = new IntelligentThinkingSystem(explorationScratchpad, thinkingEngine)

		// Tarefa: Implementar autenticação OAuth no sistema
		const taskDescription = "Implementar autenticação OAuth 2.0 no sistema de login existente"

		console.log(`🎯 Tarefa: ${taskDescription}\n`)

		// Inicializar pensamento inteligente
		await intelligentSystem.initializeIntelligentThinking(taskDescription)

		// Simular alguns dados de exploração (normalmente viriam de ferramentas reais)
		IntelligentThinkingExample.simulateExplorationData(explorationScratchpad)

		// Executar loop de pensamento inteligente
		console.log("🤔 Iniciando loop de pensamento inteligente...\n")

		const result = await intelligentSystem.executeThinkingLoop(8)

		// Mostrar resultados
		console.log("📊 Resultado Final:")
		console.log(`Decisão: ${result.finalDecision}`)
		console.log(`Confiança: ${(result.confidence * 100).toFixed(1)}%`)
		console.log(`Pensamentos processados: ${result.thoughtProcess.length}`)

		// Mostrar histórico detalhado
		console.log("\n📝 Histórico de Pensamento Inteligente:")
		console.log(intelligentSystem.formatIntelligentThinkingHistory())

		// Mostrar contexto da conversa
		const context = intelligentSystem.getConversationContext()
		console.log("\n💬 Contexto da Conversa:")
		console.log(`- Iterações: ${context.currentIteration}`)
		console.log(`- Foco atual: ${context.currentFocus}`)
		console.log(`- Nível de convergência: ${(context.convergenceLevel * 100).toFixed(1)}%`)
	}

	/**
	 * Simula dados de exploração que normalmente viriam de ferramentas reais
	 */
	private static simulateExplorationData(scratchpad: ExplorationScratchpad): void {
		// Simular leitura de package.json
		scratchpad.addEntry({
			toolName: "read_file" as any,
			query: "package.json",
			result: JSON.stringify(
				{
					name: "my-app",
					dependencies: {
						express: "^4.18.0",
						jsonwebtoken: "^9.0.0",
						bcrypt: "^5.1.0",
					},
				},
				null,
				2,
			),
			confidence: 0.9,
			tags: ["config", "dependencies"],
			filePath: "package.json",
			relevance: 1.0,
			toolParams: { path: "package.json" },
		})

		// Simular busca por autenticação existente
		scratchpad.addEntry({
			toolName: "search_files" as any,
			query: "login|auth",
			result: "Found 5 matches in 3 files:\n- auth.js: login function\n- user.js: password validation\n- routes.js: /login endpoint",
			confidence: 0.8,
			tags: ["search", "auth"],
			filePath: "",
			relevance: 0.9,
			toolParams: { regex: "login|auth" },
		})

		// Simular listagem de diretórios
		scratchpad.addEntry({
			toolName: "list_files" as any,
			query: "src directory",
			result: "src/\n├── auth.js\n├── user.js\n├── routes.js\n├── middleware/\n└── controllers/",
			confidence: 0.95,
			tags: ["structure", "files"],
			filePath: "src",
			relevance: 1.0,
			toolParams: { path: "src", recursive: "false" },
		})

		// Simular leitura de arquivo de auth existente
		scratchpad.addEntry({
			toolName: "read_file" as any,
			query: "src/auth.js",
			result: `const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

function login(username, password) {
    // Login básico com JWT
    return jwt.sign({ user: username }, 'secret')
}

module.exports = { login }`,
			confidence: 0.85,
			tags: ["code", "auth", "jwt"],
			filePath: "src/auth.js",
			relevance: 0.95,
			toolParams: { path: "src/auth.js" },
		})
	}

	/**
	 * Exemplo de pensamento passo a passo
	 */
	public static async demonstrateStepByStepThinking(): Promise<void> {
		console.log("=== Demonstração Passo a Passo do Pensamento ===\n")

		const explorationScratchpad = new ExplorationScratchpad()
		const thinkingEngine = new ThinkingEngine(explorationScratchpad)
		const intelligentSystem = new IntelligentThinkingSystem(explorationScratchpad, thinkingEngine)

		const task = "Adicionar validação de email aos formulários de registro"

		// Passo 1: Inicialização
		console.log("1️⃣ Inicialização do pensamento inteligente")
		await intelligentSystem.initializeIntelligentThinking(task)

		// Simular dados básicos
		explorationScratchpad.addEntry({
			toolName: "grep" as any,
			query: "email|register",
			result: "Found email validation in forms.js and validation.js",
			confidence: 0.7,
			tags: ["search", "forms"],
			filePath: "",
			relevance: 0.8,
			toolParams: { pattern: "email|register" },
		})

		// Passo 2: Primeira iteração do loop
		console.log("\n2️⃣ Primeira iteração - Análise inicial")
		console.log("O sistema analisa a situação atual...")

		// Simular pensamento interno
		const thoughts = intelligentSystem.getIntelligentThoughtHistory()
		if (thoughts.length > 0) {
			console.log(`Pensamento atual: ${thoughts[thoughts.length - 1].thought}`)
		}

		// Passo 3: Execução de exploração
		console.log("\n3️⃣ Exploração direcionada")
		console.log("Sistema decide explorar mais sobre validação de email...")

		// Adicionar mais dados
		explorationScratchpad.addEntry({
			toolName: "read_file" as any,
			query: "validation.js",
			result: `function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}`,
			confidence: 0.9,
			tags: ["validation", "email"],
			filePath: "validation.js",
			relevance: 0.95,
			toolParams: { path: "validation.js" },
		})

		// Passo 4: Reflexão e decisão
		console.log("\n4️⃣ Reflexão sobre dados coletados")
		intelligentSystem.registerActionResult("Validação de email já existe, mas pode ser melhorada")

		console.log("\n5️⃣ Decisão final")
		const result = await intelligentSystem.executeThinkingLoop(3)

		console.log(`✅ Decisão: ${result.finalDecision}`)
		console.log(`📈 Confiança: ${(result.confidence * 100).toFixed(1)}%`)
	}

	/**
	 * Exemplo de como o sistema lida com erros e recupera
	 */
	public static async demonstrateErrorHandling(): Promise<void> {
		console.log("=== Demonstração de Tratamento de Erros ===\n")

		const explorationScratchpad = new ExplorationScratchpad()
		const thinkingEngine = new ThinkingEngine(explorationScratchpad)
		const intelligentSystem = new IntelligentThinkingSystem(explorationScratchpad, thinkingEngine)

		await intelligentSystem.initializeIntelligentThinking("Corrigir bug de validação")

		// Simular resultado de erro
		intelligentSystem.registerActionResult("Error: Cannot read property 'validate' of undefined")

		// Sistema vai refletir sobre o erro e ajustar abordagem
		console.log("Sistema detectou erro e vai ajustar abordagem...")

		// Simular algumas iterações
		const result = await intelligentSystem.executeThinkingLoop(4)

		console.log("Resultado após tratamento de erro:")
		console.log(`Decisão: ${result.finalDecision}`)
		console.log(`Confiança ajustada: ${(result.confidence * 100).toFixed(1)}%`)
	}
}

/**
 * Função principal para executar os exemplos
 */
export async function runIntelligentThinkingExamples(): Promise<void> {
	try {
		console.log("🚀 Executando exemplos do Sistema de Pensamento Inteligente\n")

		await IntelligentThinkingExample.demonstrateIntelligentThinking()
		console.log("\n" + "=".repeat(50) + "\n")

		await IntelligentThinkingExample.demonstrateStepByStepThinking()
		console.log("\n" + "=".repeat(50) + "\n")

		await IntelligentThinkingExample.demonstrateErrorHandling()

		console.log("\n✅ Todos os exemplos executados com sucesso!")
	} catch (error) {
		console.error("❌ Erro durante execução dos exemplos:", error)
	}
}
