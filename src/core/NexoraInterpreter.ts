import type {
  NexoraContext,
  NexoraIntent,
  NexoraMessage,
  NexoraToolCall,
} from './types'
import type { NexoraMemoryContext } from './NexoraMemoryContext'
import type { NexoraAIProvider } from '../ai/NexoraAIProvider'

export interface NexoraInterpretation {
  intent: NexoraIntent
  entities: Record<string, unknown>
  toolCalls: NexoraToolCall[]
  context: NexoraContext
}

export interface NexoraInterpreter {
  interpret(
    message: NexoraMessage,
    context?: NexoraContext,
    history?: NexoraMessage[],
    memoryContext?: NexoraMemoryContext,
  ): Promise<NexoraInterpretation>
}

export class AIBackedNexoraInterpreter
  implements NexoraInterpreter
{
  constructor(
    private readonly aiProvider: NexoraAIProvider,
  ) {}

  async interpret(
    message: NexoraMessage,
    context: NexoraContext = {},
    history: NexoraMessage[] = [],
    memoryContext?: NexoraMemoryContext,
  ): Promise<NexoraInterpretation> {
    const response =
      await this.aiProvider.generate({
        messages: [...history, message],
        context: {
          ...context,
          data: {
            ...context.data,
            memoryContext,
          },
        },
        responseFormat: 'structured',
      })

    const intent: NexoraIntent =
      response.intent ?? {
        type: 'unknown',
        confidence: 0,
        description:
          'No se pudo determinar la intención de la solicitud.',
        ambiguous: true,
        requiresClarification: true,
      }

    const entities =
      Object.fromEntries(
        (intent.entities ?? []).map(
          (entity) => [
            entity.key,
            entity.value,
          ],
        ),
      )

    return {
      intent,
      entities,
      toolCalls:
        response.toolCalls ?? [],
      context,
    }
  }
}