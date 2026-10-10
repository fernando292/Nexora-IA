import type { NexoraMemory } from './NexoraMemory'

export interface NexoraMemoryContext {
  memories: NexoraMemory[]
}

export interface NexoraMemoryContextBuilder {
  build(
    memories: NexoraMemory[],
  ): NexoraMemoryContext
}

export class DefaultNexoraMemoryContextBuilder
  implements NexoraMemoryContextBuilder
{
  build(
    memories: NexoraMemory[],
  ): NexoraMemoryContext {
    return {
      memories: [...memories],
    }
  }
}