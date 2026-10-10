import type { NexoraContext } from './types'

export type NexoraMemoryType =
  | 'fact'
  | 'preference'
  | 'project'
  | 'instruction'
  | 'inference'

export interface NexoraMemory {
  id: string
  type: NexoraMemoryType
  key: string
  value: unknown
  confidence: number
  context?: NexoraContext
  createdAt: number
  updatedAt: number
}

export interface NexoraMemoryStore {
  save(memory: NexoraMemory): Promise<void>
  getById(id: string): Promise<NexoraMemory | undefined>
  findByKey(key: string): Promise<NexoraMemory[]>
  getAll(): Promise<NexoraMemory[]>
  update(
    id: string,
    changes: Partial<
      Omit<
        NexoraMemory,
        'id' | 'createdAt'
      >
    >,
  ): Promise<void>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

export class InMemoryNexoraMemoryStore
  implements NexoraMemoryStore
{
  private readonly memories =
    new Map<string, NexoraMemory>()

  async save(
    memory: NexoraMemory,
  ): Promise<void> {
    this.memories.set(
      memory.id,
      { ...memory },
    )
  }

  async getById(
    id: string,
  ): Promise<NexoraMemory | undefined> {
    const memory =
      this.memories.get(id)

    return memory
      ? { ...memory }
      : undefined
  }

  async findByKey(
    key: string,
  ): Promise<NexoraMemory[]> {
    return Array.from(
      this.memories.values(),
    )
      .filter(
        (memory) => memory.key === key,
      )
      .map((memory) => ({
        ...memory,
      }))
  }

  async getAll(): Promise<NexoraMemory[]> {
    return Array.from(
      this.memories.values(),
    ).map((memory) => ({
      ...memory,
    }))
  }

  async update(
    id: string,
    changes: Partial<
      Omit<
        NexoraMemory,
        'id' | 'createdAt'
      >
    >,
  ): Promise<void> {
    const current =
      this.memories.get(id)

    if (!current) {
      throw new Error(
        `La memoria "${id}" no existe.`,
      )
    }

    this.memories.set(id, {
      ...current,
      ...changes,
      updatedAt: Date.now(),
    })
  }

  async remove(
    id: string,
  ): Promise<void> {
    this.memories.delete(id)
  }

  async clear(): Promise<void> {
    this.memories.clear()
  }
}