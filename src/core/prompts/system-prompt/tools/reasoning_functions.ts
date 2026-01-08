import { ModelFamily } from "@shared/prompts"
import { ClineDefaultTool } from "@shared/tools"
import type { ClineToolSpec } from "../spec"

const REASONING_FUNCTIONS_DESCRIPTION = `Sistema de raciocínio inteligente que fornece acesso a funções de análise e exploração estruturada.

**SISTEMA DE PENSAMENTO INTELIGENTE - FUNÇÕES DISPONÍVEIS:**

## PENSAMENTO INTELIGENTE COMPLETO

1. **intelligent_thinking(max_iterations)**
   - Executa loop completo de pensamento inteligente
   - Segue fluxo: EXPLORE → THINK → EXPLORE → THINK → EXPLORE → THINK → EXECUTE → THINK → REFLECT
   - Essencial para problemas complexos ou decisões importantes
   - Gera decisão final com alta confiança

2. **intelligent_thinking_history()**
   - Mostra histórico completo do processo de pensamento inteligente
   - Permite acompanhar evolução do raciocínio conversacional
   - Útil para debugging e validação de decisões

## ANÁLISE E EXPLORAÇÃO

3. **exploration_summary()**
   - Gera resumo estruturado de todas as explorações realizadas
   - Mostra estatísticas, descobertas chave e nível de confiança
   - Essencial antes de tomar decisões importantes

4. **tough_reasoning(max_iterations, min_confidence)**
   - Executa análise profunda e iterativa para problemas complexos
   - Faz múltiplas iterações conectando evidências
   - Transita automaticamente para EXECUTE quando confiança > min_confidence

5. **check_cache(tool_name, query, file_path?)**
   - Verifica se já explorou algo similar usando cache inteligente
   - Evita retrabalho desnecessário
   - Mostra resultado anterior se disponível

6. **get_exploration_recommendations()**
   - Recebe sugestões inteligentes do que explorar em seguida
   - Baseado no estado atual da exploração
   - Ajuda a decidir próximos passos

## DECISÃO FINAL

7. **thinking_history()**
   - Mostra o histórico completo do processo de pensamento básico
   - Permite acompanhar como o raciocínio evoluiu
   - Útil para debugging e validação

8. **final_decision()**
   - Toma decisão final baseada em todas as evidências coletadas
   - Gera plano de ação estruturado
   - Transita automaticamente para fase EXECUTE

**QUANDO USAR (OBRIGATÓRIO):**

### PENSAMENTO BÁSICO (AUTOMÁTICO)
- ✅ **SEMPRE ATIVADO** - Sistema pensa automaticamente antes de cada ferramenta
- ✅ **CACHE VERIFICATION** - Verificação automática de resultados anteriores
- ✅ **RELEVANCE CHECK** - Avaliação automática se ferramenta faz sentido
- ✅ **CONFIDENCE CALCULATION** - Cálculo automático de confiança da ação

### PENSAMENTO INTELIGENTE (QUANDO CHAMAR)
- 🎯 **PROBLEMAS COMPLEXOS** - Quando confiança < 85% ou decisão crítica
- 🎯 **EXPLORAÇÃO INICIAL** - Para entender contexto de tarefas novas
- 🎯 **VALIDAÇÃO FINAL** - Antes de executar mudanças importantes
- 🎯 **APRENDIZADO** - Para refletir sobre ações executadas

### FLUXO OBRIGATÓRIO:
**EXPLORE → THINK → EXPLORE → THINK → EXPLORE → THINK → EXECUTE → THINK → REFLECT**

Esta ferramenta transforma você em um "desenvolvedor que pensa junto" através de raciocínio conversacional estruturado.`

export const reasoning_functions_variants: ClineToolSpec[] = [
	{
		variant: ModelFamily.GENERIC,
		id: ClineDefaultTool.REASONING,
		name: "Reasoning Functions",
		description: REASONING_FUNCTIONS_DESCRIPTION,
		parameters: [
			{
				name: "function",
				required: true,
				instruction: "Função de raciocínio a executar",
				description:
					"Funções disponíveis: intelligent_thinking, intelligent_thinking_history, exploration_summary, tough_reasoning, check_cache, get_exploration_recommendations, thinking_history, final_decision",
			},
			{
				name: "max_iterations",
				required: false,
				instruction: "Máximo de iterações para intelligent_thinking/tough_reasoning (padrão: 5-8)",
				description: "Número máximo de iterações para análise profunda",
			},
			{
				name: "min_confidence",
				required: false,
				instruction: "Confiança mínima para tough_reasoning (padrão: 0.85)",
				description: "Nível mínimo de confiança para considerar a análise concluída",
			},
			{
				name: "tool_name",
				required: false,
				instruction: "Nome da ferramenta para check_cache",
				description:
					"Ferramenta para verificar no cache: read_file, search_files, list_files, list_code_definition_names",
			},
			{
				name: "query",
				required: false,
				instruction: "Query para check_cache ou busca semântica",
				description: "Termo de busca para verificar no cache ou pesquisa",
			},
			{
				name: "file_path",
				required: false,
				instruction: "Caminho do arquivo para check_cache (opcional)",
				description: "Caminho específico do arquivo para verificação no cache",
			},
			{
				name: "intelligent_thinking",
				required: false,
				instruction: "Função intelligent_thinking(max_iterations) - pensamento completo",
				description: "Executa loop completo: EXPLORE→THINK→EXPLORE→THINK→EXPLORE→THINK→EXECUTE→THINK→REFLECT",
			},
			{
				name: "intelligent_thinking_history",
				required: false,
				instruction: "Função intelligent_thinking_history() - histórico completo",
				description: "Mostra histórico completo do processo de pensamento inteligente",
			},
			{
				name: "thinking_history",
				required: false,
				instruction: "Função thinking_history() - histórico básico",
				description: "Mostra histórico completo do processo de pensamento básico",
			},
			{
				name: "final_decision",
				required: false,
				instruction: "Função final_decision() - decisão final",
				description: "Toma decisão final e gera plano de ação baseado em evidências",
			},
		],
	},
]
