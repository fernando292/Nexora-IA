
import type {
  NexoraExecutionResult,
  NexoraToolCall,
} from './types'
import { NexoraPermissionManager } from './NexoraPermissionManager'
import { NexoraToolRegistry } from './NexoraToolRegistry'

export interface NexoraExecutorDependencies {
  toolRegistry: NexoraToolRegistry
  permissionManager: NexoraPermissionManager
}

export interface NexoraExecutionOptions {
  confirmed?: boolean
}

export class NexoraExecutor {
  private readonly toolRegistry: NexoraToolRegistry
  private readonly permissionManager: NexoraPermissionManager

  constructor(
    dependencies: NexoraExecutorDependencies,
  ) {
    this.toolRegistry = dependencies.toolRegistry
    this.permissionManager =
      dependencies.permissionManager
  }

  async execute(
    toolCall: NexoraToolCall,
    options: NexoraExecutionOptions = {},
  ): Promise<NexoraExecutionResult> {
    const tool = this.toolRegistry.get(
      toolCall.toolId,
    )

    if (!tool) {
      return {
        toolId: toolCall.toolId,
        success: false,
        error:
          `La herramienta "${toolCall.toolId}" no está registrada.`,
      }
    }

    const permission =
      this.permissionManager.getPermission(
        toolCall.toolId,
      )

    if (!permission) {
      return {
        toolId: toolCall.toolId,
        success: false,
        error:
          'La herramienta no tiene permisos configurados.',
      }
    }

    if (!permission.allowed) {
      return {
        toolId: toolCall.toolId,
        success: false,
        error:
          'La ejecución de esta herramienta no está autorizada.',
      }
    }

    if (
      permission.requiresConfirmation &&
      options.confirmed !== true
    ) {
      return {
        toolId: toolCall.toolId,
        success: false,
        error:
          'La herramienta requiere confirmación antes de ejecutarse.',
      }
    }

    try {
      const result =
        await tool.execute(toolCall)

      return {
        toolId: toolCall.toolId,
        success: true,
        result,
      }
    } catch (error) {
      return {
        toolId: toolCall.toolId,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al ejecutar la herramienta.',
      }
    }
  }
}
