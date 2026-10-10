import type { NexoraMemory } from './NexoraMemory'

export type NexoraMemoryUpdateAction =
  | 'create'
  | 'update'
  | 'keep'
  | 'reject'

export interface NexoraMemoryUpdateCandidate {
  type: NexoraMemory['type']
  key: string
  value: unknown
  confidence: number
}

export interface NexoraMemoryUpdateDecision {
  action: NexoraMemoryUpdateAction
  reason: string
  existingMemory?: NexoraMemory
}

export interface NexoraMemoryUpdatePolicy {
  evaluate(
    existingMemory:
      | NexoraMemory
      | undefined,
    candidate: NexoraMemoryUpdateCandidate,
  ): NexoraMemoryUpdateDecision
}

export class DefaultNexoraMemoryUpdatePolicy
  implements NexoraMemoryUpdatePolicy
{
  evaluate(
    existingMemory:
      | NexoraMemory
      | undefined,
    candidate: NexoraMemoryUpdateCandidate,
  ): NexoraMemoryUpdateDecision {
    if (!existingMemory) {
      return {
        action: 'create',
        reason:
          'No existe una memoria previa con esta clave.',
      }
    }

    if (
      existingMemory.type !==
      candidate.type
    ) {
      return {
        action: 'reject',
        reason:
          'La memoria existente tiene un tipo diferente.',
        existingMemory,
      }
    }

    if (
      Object.is(
        existingMemory.value,
        candidate.value,
      )
    ) {
      if (
        candidate.confidence >
        existingMemory.confidence
      ) {
        return {
          action: 'update',
          reason:
            'El valor es el mismo pero la nueva memoria tiene mayor confianza.',
          existingMemory,
        }
      }

      return {
        action: 'keep',
        reason:
          'La memoria existente ya contiene el mismo valor con confianza suficiente.',
        existingMemory,
      }
    }

    if (
      candidate.confidence >
      existingMemory.confidence
    ) {
      return {
        action: 'update',
        reason:
          'La nueva memoria tiene mayor confianza.',
        existingMemory,
      }
    }

    return {
      action: 'reject',
      reason:
        'Existe una memoria diferente con mayor o igual confianza.',
      existingMemory,
    }
  }
}