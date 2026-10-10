import type {
  NexoraContext,
  NexoraExecutionResult,
  NexoraMessage,
  NexoraToolDefinition,
} from './types'
import type {
  NexoraMemoryContext,
} from './NexoraMemoryContext'
import type {
  NexoraInterpretation,
  NexoraInterpreter,
} from './NexoraInterpreter'
import type {
  NexoraPlan,
  NexoraPlanner,
} from './NexoraPlanner'
import type {
  NexoraInterpretedExecutionResult,
} from './NexoraResultInterpreter'
import type {
  NexoraAIPlanIssue,
  NexoraAIProvider,
  NexoraAIResponse,
} from '../ai/NexoraAIProvider'

export interface NexoraEngineInput {
  message: NexoraMessage
  context?: NexoraContext
  history?: NexoraMessage[]
  memoryContext?: NexoraMemoryContext
}

export interface NexoraEngineResult {
  interpretation: NexoraInterpretation
  plan: NexoraPlan
}

export interface NexoraEngineResponseInput {
  message: NexoraMessage
  context?: NexoraContext
  history?: NexoraMessage[]
  memoryContext?: NexoraMemoryContext
  executionResults: NexoraExecutionResult[]
  interpretedExecutionResults?: NexoraInterpretedExecutionResult[]
  planIssues?: NexoraAIPlanIssue[]
}

export interface NexoraEngineDependencies {
  interpreter: NexoraInterpreter
  planner: NexoraPlanner
  aiProvider?: NexoraAIProvider
  getAvailableTools?: () => NexoraToolDefinition[]
}

export interface NexoraEngine {
  process(
    input: NexoraEngineInput,
  ): Promise<NexoraEngineResult>

  generateResponse(
    input: NexoraEngineResponseInput,
  ): Promise<NexoraAIResponse>
}

export class DefaultNexoraEngine
  implements NexoraEngine
{
  private readonly interpreter: NexoraInterpreter
  private readonly planner: NexoraPlanner
  private readonly aiProvider?: NexoraAIProvider
  private readonly getAvailableTools: () => NexoraToolDefinition[]

  constructor(
    dependencies: NexoraEngineDependencies,
  ) {
    this.interpreter = dependencies.interpreter
    this.planner = dependencies.planner
    this.aiProvider = dependencies.aiProvider
    this.getAvailableTools =
      dependencies.getAvailableTools ?? (() => [])
  }

  async process(
    input: NexoraEngineInput,
  ): Promise<NexoraEngineResult> {
    const interpretation =
      await this.interpreter.interpret(
        input.message,
        input.context,
        input.history,
        input.memoryContext,
      )

    const plan = await this.planner.plan({
      intent: interpretation.intent,
      toolCalls: interpretation.toolCalls,
      availableTools: this.getAvailableTools(),
      context: interpretation.context,
    })

    return {
      interpretation,
      plan,
    }
  }

  async generateResponse(
    input: NexoraEngineResponseInput,
  ): Promise<NexoraAIResponse> {
    if (!this.aiProvider) {
      return {
        content:
          'La solicitud fue procesada, pero no hay un proveedor de IA configurado para generar la respuesta final.',
      }
    }

    return this.aiProvider.generate({
      messages: input.history
        ? [...input.history, input.message]
        : [input.message],
      context: {
        ...input.context,
        data: {
          ...input.context?.data,
          memoryContext:
            input.memoryContext,
        },
      },
      executionResults:
        input.executionResults,
      interpretedExecutionResults:
        input.interpretedExecutionResults,
      planIssues:
        input.planIssues,
      responseFormat: 'text',
    })
  }
}
