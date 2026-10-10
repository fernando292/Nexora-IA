import type {
  NexoraToolDefinition,
  NexoraToolCall,
} from './types'

export interface NexoraTool {
  definition: NexoraToolDefinition
  execute(
    call: NexoraToolCall,
  ): Promise<unknown>
}

export class NexoraToolRegistry {
  private readonly tools = new Map<string, NexoraTool>()

  register(tool: NexoraTool): void {
    this.tools.set(tool.definition.id, tool)
  }

  unregister(toolId: string): void {
    this.tools.delete(toolId)
  }

  get(toolId: string): NexoraTool | undefined {
    return this.tools.get(toolId)
  }

  getAll(): NexoraTool[] {
    return Array.from(this.tools.values())
  }

  has(toolId: string): boolean {
    return this.tools.has(toolId)
  }
}