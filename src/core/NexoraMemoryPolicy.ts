import type {
  NexoraMemoryType,
} from './NexoraMemory'

export interface NexoraMemoryCandidate {
  type: NexoraMemoryType
  key: string
  value: unknown
  confidence: number
}

export interface NexoraMemoryDecision {
  allowed: boolean
  reason: string
}

export interface NexoraMemoryPolicy {
  evaluate(
    candidate: NexoraMemoryCandidate,
  ): NexoraMemoryDecision
}

export class DefaultNexoraMemoryPolicy
  implements NexoraMemoryPolicy
{
  evaluate(
    candidate: NexoraMemoryCandidate,
  ): NexoraMemoryDecision {
    if (
      !candidate.key.trim()
    ) {
      return {
        allowed: false,
        reason:
          'La memoria debe tener una clave válida.',
      }
    }

    if (
      candidate.value === undefined ||
      candidate.value === null
    ) {
      return {
        allowed: false,
        reason:
          'La memoria debe tener un valor válido.',
      }
    }

    if (
      !Number.isFinite(
        candidate.confidence,
      ) ||
      candidate.confidence < 0 ||
      candidate.confidence > 1
    ) {
      return {
        allowed: false,
        reason:
          'La confianza debe estar entre 0 y 1.',
      }
    }

    if (
      candidate.type === 'inference' &&
      candidate.confidence < 0.8
    ) {
      return {
        allowed: false,
        reason:
          'Las inferencias requieren una confianza mínima de 0.8.',
      }
    }

    return {
      allowed: true,
      reason:
        'La memoria cumple la política actual.',
    }
  }
}