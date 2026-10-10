import type { NexoraContext as NexoraContextData } from './types'

export interface NexoraContextStore {
  get(): NexoraContextData
  update(context: Partial<NexoraContextData>): void
  clear(): void
}

export class NexoraContextManager implements NexoraContextStore {
  private context: NexoraContextData = {}

  get(): NexoraContextData {
    return { ...this.context }
  }

  update(context: Partial<NexoraContextData>): void {
    this.context = {
      ...this.context,
      ...context,
    }
  }

  clear(): void {
    this.context = {}
  }
}