// Main database module exports
export { DatabaseClient, getDatabase } from "./client"
export * from "./operations"
// Re-export commonly used functions for convenience
export {
	createBenchmarkRun,
	createCase,
	getRunStats,
	insertResult,
	upsertFile,
	upsertProcessingFunctions,
	upsertSystemPrompt,
} from "./operations"
export * from "./queries"
export {
	getDatabaseSummary,
	getErrorDistribution,
	getModelComparisons,
	getSuccessRatesByModel,
} from "./queries"
export * from "./types"
