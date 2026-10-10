import type { NexoraPlanStep } from './NexoraPlanner'

export type NexoraTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'waiting_for_input'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface NexoraTaskInformation {
  key: string
  value: unknown
  source: string
}

export interface NexoraTaskMissingInformation {
  key: string
  reason: string
}

export interface NexoraTask {
  id: string
  objective: string
  status: NexoraTaskStatus
  missingInformation: NexoraTaskMissingInformation[]
  availableInformation: NexoraTaskInformation[]
  plan?: NexoraPlanStep[]
}