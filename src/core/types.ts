export type NexoraRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool'

export interface NexoraMessage {
  id: string
  role: NexoraRole
  content: string
  createdAt: number
}

export interface NexoraContext {
  conversationId?: string
  projectId?: string
  userId?: string
  taskId?: string
  data?: Record<string, unknown>
}

export type NexoraIntentType =
  | 'question'
  | 'analysis'
  | 'action'
  | 'clarification'
  | 'conversation'
  | 'unknown'

export interface NexoraEntity {
  key: string
  value: unknown
  confidence: number
}

export interface NexoraIntent {
  type: NexoraIntentType
  confidence: number
  description?: string
  goal?: string
  entities?: NexoraEntity[]
  ambiguous?: boolean
  requiresClarification?: boolean
}

export interface NexoraToolInputDefinition {
  name: string
  description?: string
  required?: boolean
  semanticType?: string
}

export interface NexoraToolOutputDefinition {
  path: string
  description?: string
  semanticType?: string
}

export interface NexoraToolDefinition {
  id: string
  name: string
  description: string
  requiresConfirmation: boolean
  inputs?: NexoraToolInputDefinition[]
  outputs?: NexoraToolOutputDefinition[]
}

export interface NexoraToolCall {
  toolId: string
  arguments: Record<string, unknown>
}

export interface NexoraStepOutputReference {
  stepId: string
  path?: string
}

export interface NexoraPermission {
  toolId: string
  allowed: boolean
  requiresConfirmation: boolean
}

export interface NexoraExecutionResult {
  toolId: string
  success: boolean
  result?: unknown
  error?: string
}

export interface NexoraResponse {
  message: NexoraMessage
  intent?: NexoraIntent
  toolCalls?: NexoraToolCall[]
  executionResults?: NexoraExecutionResult[]
  requiresConfirmation?: boolean
}
