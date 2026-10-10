import type {
  NexoraExecutionResult,
} from './types'

export interface NexoraInterpretedExecutionResult {
  toolId: string
  success: boolean
  summary: string
  data?: unknown
  error?: string
}

export interface NexoraResultInterpreter {
  interpret(
    result: NexoraExecutionResult,
  ): NexoraInterpretedExecutionResult
}

export class DefaultNexoraResultInterpreter
  implements NexoraResultInterpreter
{
  interpret(
    result: NexoraExecutionResult,
  ): NexoraInterpretedExecutionResult {
    if (!result.success) {
      return {
        toolId: result.toolId,
        success: false,
        summary:
          `La herramienta "${result.toolId}" no pudo ejecutarse.`,
        error:
          result.error ??
          'Error desconocido al ejecutar la herramienta.',
      }
    }

    return {
      toolId: result.toolId,
      success: true,
      summary:
        `La herramienta "${result.toolId}" se ejecutó correctamente.`,
      data: result.result,
    }
  }
}
