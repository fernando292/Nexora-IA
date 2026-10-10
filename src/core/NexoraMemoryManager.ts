import type {
  NexoraMemory,
  NexoraMemoryStore,
  NexoraMemoryType,
} from './NexoraMemory'
import type { NexoraContext } from './types'
import type {
  NexoraMemoryPolicy,
  NexoraMemoryCandidate,
} from './NexoraMemoryPolicy'
import {
  DefaultNexoraMemoryPolicy,
} from './NexoraMemoryPolicy'
import type {
  NexoraMemoryRetriever,
} from './NexoraMemoryRetriever'
import {
  DefaultNexoraMemoryRetriever,
} from './NexoraMemoryRetriever'
import type {
  NexoraMemoryUpdatePolicy,
  NexoraMemoryUpdateCandidate,
} from './NexoraMemoryUpdatePolicy'
import {
  DefaultNexoraMemoryUpdatePolicy,
} from './NexoraMemoryUpdatePolicy'

export interface CreateMemoryInput {
  type: NexoraMemoryType
  key: string
  value: unknown
  confidence?: number
  context?: NexoraContext
}

export class NexoraMemoryManager {
  private readonly policy: NexoraMemoryPolicy
  private readonly retriever: NexoraMemoryRetriever
  private readonly updatePolicy: NexoraMemoryUpdatePolicy

  constructor(
    private readonly store: NexoraMemoryStore,
    policy?: NexoraMemoryPolicy,
    retriever?: NexoraMemoryRetriever,
    updatePolicy?: NexoraMemoryUpdatePolicy,
  ) {
    this.policy =
      policy ??
      new DefaultNexoraMemoryPolicy()

    this.retriever =
      retriever ??
      new DefaultNexoraMemoryRetriever()

    this.updatePolicy =
      updatePolicy ??
      new DefaultNexoraMemoryUpdatePolicy()
  }

  async remember(
    input: CreateMemoryInput,
  ): Promise<NexoraMemory> {
    const candidate: NexoraMemoryCandidate = {
      type: input.type,
      key: input.key,
      value: input.value,
      confidence:
        input.confidence ?? 1,
    }

    const decision =
      this.policy.evaluate(
        candidate,
      )

    if (!decision.allowed) {
      throw new Error(
        `Memoria rechazada: ${decision.reason}`,
      )
    }

    const existingMemories =
      await this.store.findByKey(
        input.key,
      )

    const existingMemory =
      existingMemories[0]

    const updateCandidate: NexoraMemoryUpdateCandidate =
      {
        type: input.type,
        key: input.key,
        value: input.value,
        confidence:
          input.confidence ?? 1,
      }

    const updateDecision =
      this.updatePolicy.evaluate(
        existingMemory,
        updateCandidate,
      )

    if (
      updateDecision.action === 'reject'
    ) {
      throw new Error(
        `Memoria rechazada: ${updateDecision.reason}`,
      )
    }

    if (
      updateDecision.action === 'keep' &&
      updateDecision.existingMemory
    ) {
      return updateDecision.existingMemory
    }

    if (
      updateDecision.action === 'update' &&
      updateDecision.existingMemory
    ) {
      const now = Date.now()

      await this.store.update(
        updateDecision.existingMemory.id,
        {
          type: input.type,
          key: input.key,
          value: input.value,
          confidence:
            input.confidence ?? 1,
          context: input.context,
          updatedAt: now,
        },
      )

      const updatedMemory =
        await this.store.getById(
          updateDecision.existingMemory.id,
        )

      if (!updatedMemory) {
        throw new Error(
          'No se pudo recuperar la memoria actualizada.',
        )
      }

      return updatedMemory
    }

    const now = Date.now()

    const memory: NexoraMemory = {
      id: crypto.randomUUID(),
      type: input.type,
      key: input.key,
      value: input.value,
      confidence:
        input.confidence ?? 1,
      context: input.context,
      createdAt: now,
      updatedAt: now,
    }

    await this.store.save(memory)

    return memory
  }

  async get(
    id: string,
  ): Promise<NexoraMemory | undefined> {
    return this.store.getById(id)
  }

  async find(
    key: string,
  ): Promise<NexoraMemory[]> {
    return this.store.findByKey(key)
  }

  async retrieve(
    query: string,
  ): Promise<NexoraMemory[]> {
    const memories =
      await this.store.getAll()

    return this.retriever.retrieve(
      memories,
      query,
    )
  }

  async getAll(): Promise<NexoraMemory[]> {
    return this.store.getAll()
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
    await this.store.update(
      id,
      changes,
    )
  }

  async remove(
    id: string,
  ): Promise<void> {
    await this.store.remove(id)
  }

  async clear(): Promise<void> {
    await this.store.clear()
  }
}