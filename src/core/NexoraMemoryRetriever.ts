import type { NexoraMemory } from './NexoraMemory'

export interface NexoraMemoryRetriever {
  retrieve(
    memories: NexoraMemory[],
    query: string,
  ): NexoraMemory[]
}

export class DefaultNexoraMemoryRetriever
  implements NexoraMemoryRetriever
{
  retrieve(
    memories: NexoraMemory[],
    query: string,
  ): NexoraMemory[] {
    const normalizedQuery =
      query.trim().toLowerCase()

    if (!normalizedQuery) {
      return []
    }

    return memories.filter((memory) => {
      const key =
        memory.key.toLowerCase()

      const value =
        String(memory.value).toLowerCase()

      return (
        normalizedQuery.includes(key) ||
        key.includes(normalizedQuery) ||
        normalizedQuery.includes(value) ||
        value.includes(normalizedQuery)
      )
    })
  }
}