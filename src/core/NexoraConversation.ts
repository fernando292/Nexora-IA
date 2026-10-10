import type { NexoraMessage } from './types'

export interface NexoraConversationStore {
  addMessage(message: NexoraMessage): void
  getMessages(): NexoraMessage[]
  clear(): void
}

export class NexoraConversationManager
  implements NexoraConversationStore
{
  private readonly messages: NexoraMessage[] = []

  addMessage(message: NexoraMessage): void {
    this.messages.push(message)
  }

  getMessages(): NexoraMessage[] {
    return [...this.messages]
  }

  clear(): void {
    this.messages.length = 0
  }
}