import type {
  NexoraContext,
  NexoraExecutionResult,
  NexoraIntent,
  NexoraMessage,
  NexoraToolCall,
} from '../core/types'
import type {
  NexoraInterpretedExecutionResult,
} from '../core/NexoraResultInterpreter'

export interface NexoraAIPlanIssue {
  type: 'blocked'
  stepId: string
  toolId?: string
  missingInputs?: string[]
  description?: string
}

export interface NexoraAIRequest {
  messages: NexoraMessage[]
  context?: NexoraContext
  executionResults?: NexoraExecutionResult[]
  interpretedExecutionResults?: NexoraInterpretedExecutionResult[]
  planIssues?: NexoraAIPlanIssue[]
  responseFormat?: 'text' | 'structured'
}

export interface NexoraAIResponse {
  content: string
  intent?: NexoraIntent
  toolCalls?: NexoraToolCall[]
  metadata?: Record<string, unknown>
}

export interface NexoraAIProvider {
  generate(
    request: NexoraAIRequest,
  ): Promise<NexoraAIResponse>
}
