
import type {
  NexoraContext,
  NexoraMessage,
  NexoraResponse,
  NexoraToolCall,
} from './types'
import type {
  NexoraEngine,
  NexoraEngineResult,
} from './NexoraEngine'
import type {
  NexoraPlan,
  NexoraPlanStep,
} from './NexoraPlanner'
import type {
  NexoraAIPlanIssue,
} from '../ai/NexoraAIProvider'
import {
  DefaultNexoraResultInterpreter,
  type NexoraResultInterpreter,
} from './NexoraResultInterpreter'
import type {
  NexoraInterpretedExecutionResult,
} from './NexoraResultInterpreter'
import { NexoraContextManager } from './NexoraContext'
import { NexoraConversationManager } from './NexoraConversation'
import { NexoraMemoryManager } from './NexoraMemoryManager'
import {
  InMemoryNexoraMemoryStore,
  type NexoraMemory,
} from './NexoraMemory'
import {
  DefaultNexoraMemoryContextBuilder,
  type NexoraMemoryContextBuilder,
} from './NexoraMemoryContext'
import { NexoraPermissionManager } from './NexoraPermissionManager'
import { NexoraToolRegistry } from './NexoraToolRegistry'
import { NexoraExecutor } from './NexoraExecutor'
import { NexoraPlanExecutor } from './NexoraPlanExecutor'
import {
  DefaultNexoraTaskFactory,
  type NexoraTaskFactory,
} from './NexoraTaskFactory'
import { NexoraTaskManager } from './NexoraTaskManager'
import type {
  NexoraTask,
} from './NexoraTask'

export interface NexoraCoreInput {
  content: string
  context?: NexoraContext
}

export interface NexoraCoreDependencies {
  engine: NexoraEngine
  contextManager?: NexoraContextManager
  conversationManager?: NexoraConversationManager
  memoryManager?: NexoraMemoryManager
  memoryContextBuilder?: NexoraMemoryContextBuilder
  toolRegistry?: NexoraToolRegistry
  permissionManager?: NexoraPermissionManager
  executor?: NexoraExecutor
  planExecutor?: NexoraPlanExecutor
  resultInterpreter?: NexoraResultInterpreter
  taskFactory?: NexoraTaskFactory
  taskManager?: NexoraTaskManager
}

export interface NexoraPendingPlan {
  id: string
  plan: NexoraPlan
  createdAt: number
  userMessage: NexoraMessage
  context: NexoraContext
  memoryContext: ReturnType<
    NexoraMemoryContextBuilder['build']
  >
}

export class NexoraCore {
  private readonly engine: NexoraEngine
  private readonly contextManager: NexoraContextManager
  private readonly conversationManager: NexoraConversationManager
  private readonly memoryManager: NexoraMemoryManager
  private readonly memoryContextBuilder: NexoraMemoryContextBuilder
  private readonly toolRegistry: NexoraToolRegistry
  private readonly permissionManager: NexoraPermissionManager
  private readonly executor: NexoraExecutor
  private readonly planExecutor: NexoraPlanExecutor
  private readonly resultInterpreter: NexoraResultInterpreter
  private readonly taskFactory: NexoraTaskFactory
  private readonly taskManager: NexoraTaskManager

  private pendingPlan: NexoraPendingPlan | undefined

  constructor(dependencies: NexoraCoreDependencies) {
    this.engine = dependencies.engine

    this.contextManager =
      dependencies.contextManager ??
      new NexoraContextManager()

    this.conversationManager =
      dependencies.conversationManager ??
      new NexoraConversationManager()

    this.memoryManager =
      dependencies.memoryManager ??
      new NexoraMemoryManager(
        new InMemoryNexoraMemoryStore(),
      )

    this.memoryContextBuilder =
      dependencies.memoryContextBuilder ??
      new DefaultNexoraMemoryContextBuilder()

    this.toolRegistry =
      dependencies.toolRegistry ??
      new NexoraToolRegistry()

    this.permissionManager =
      dependencies.permissionManager ??
      new NexoraPermissionManager()

    this.executor =
      dependencies.executor ??
      new NexoraExecutor({
        toolRegistry: this.toolRegistry,
        permissionManager: this.permissionManager,
      })

    this.planExecutor =
      dependencies.planExecutor ??
      new NexoraPlanExecutor(this.executor)

    this.resultInterpreter =
      dependencies.resultInterpreter ??
      new DefaultNexoraResultInterpreter()

    this.taskFactory =
      dependencies.taskFactory ??
      new DefaultNexoraTaskFactory()

    this.taskManager =
      dependencies.taskManager ??
      new NexoraTaskManager()
  }

  async process(
    input: NexoraCoreInput,
  ): Promise<NexoraResponse> {
    const context =
      input.context ??
      this.contextManager.get()

    const activeTaskId =
      context.taskId ??
      this.contextManager.get().taskId

    const activeTask = activeTaskId
      ? this.taskManager.get(activeTaskId)
      : undefined

    const continuingTask =
      activeTask?.status === 'waiting_for_input'
        ? activeTask
        : undefined

    const engineContext: NexoraContext =
      continuingTask
        ? {
            ...context,
            data: {
              ...context.data,
              activeTask: {
                id: continuingTask.id,
                objective: continuingTask.objective,
                status: continuingTask.status,
                missingInformation:
                  continuingTask.missingInformation,
                availableInformation:
                  continuingTask.availableInformation,
                plan: continuingTask.plan,
              },
            },
          }
        : context

    const userMessage: NexoraMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.content,
      createdAt: Date.now(),
    }

    const history =
      this.conversationManager.getMessages()

    this.conversationManager.addMessage(userMessage)

    const relevantMemories =
      await this.memoryManager.retrieve(input.content)

    const memoryContext =
      this.memoryContextBuilder.build(relevantMemories)

    const result: NexoraEngineResult =
      await this.engine.process({
        message: userMessage,
        context: engineContext,
        history,
        memoryContext,
      })

    const toolCalls =
      result.plan.steps
        .map((step) => step.toolCall)
        .filter(
          (toolCall): toolCall is NexoraToolCall =>
            toolCall !== undefined,
        )

    const entities =
      result.interpretation.intent.entities ?? []

    const continuationCall =
      continuingTask
        ? toolCalls.find((call) =>
            continuingTask.plan?.some((step) => {
              if (
                step.status !== 'blocked' ||
                !step.toolCall ||
                step.toolCall.toolId !== call.toolId
              ) {
                return false
              }

              return continuingTask.missingInformation.some(
                (missing) => {
                  if (
                    !step.missingInputs?.includes(missing.key)
                  ) {
                    return false
                  }

                  const suppliedValue =
                    call.arguments[missing.key]

                  if (
                    suppliedValue === undefined ||
                    suppliedValue === null ||
                    suppliedValue === ''
                  ) {
                    return false
                  }

                  return entities.some(
                    (entity) =>
                      entity.key === missing.key &&
                      entity.value !== undefined &&
                      entity.value !== null &&
                      String(entity.value) ===
                        String(suppliedValue),
                  )
                },
              )
            }),
          )
        : undefined

    const isContinuation =
      continuingTask !== undefined &&
      continuationCall !== undefined

    if (continuingTask && !isContinuation) {
      const assistantMessage: NexoraMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'La tarea original sigue pendiente. Proporciona el identificador solicitado para continuar; no he ejecutado ninguna acción nueva.',
        createdAt: Date.now(),
      }

      this.conversationManager.addMessage(assistantMessage)

      return {
        message: assistantMessage,
        intent: result.interpretation.intent,
        requiresConfirmation: false,
      }
    }

    const generatedTask =
      this.taskFactory.create(result)

    const receivedInformation =
      isContinuation
        ? entities
            .filter((entity) => {
              if (
                entity.value === undefined ||
                entity.value === null
              ) {
                return false
              }

              const suppliedValue =
                continuationCall.arguments[entity.key]

              return (
                suppliedValue !== undefined &&
                suppliedValue !== null &&
                String(entity.value) ===
                  String(suppliedValue) &&
                continuingTask.missingInformation.some(
                  (missing) => missing.key === entity.key,
                )
              )
            })
            .map((entity) => ({
              key: entity.key,
              value: entity.value,
              source: userMessage.id,
            }))
        : []

    const mergedInformation = isContinuation
      ? [
          ...continuingTask.availableInformation.filter(
            (existing) =>
              !receivedInformation.some(
                (received) =>
                  received.key === existing.key,
              ),
          ),
          ...receivedInformation,
        ]
      : generatedTask.availableInformation

    const task: NexoraTask = isContinuation
      ? {
          ...generatedTask,
          id: continuingTask.id,
          objective: continuingTask.objective,
          status:
            generatedTask.missingInformation.length > 0
              ? 'waiting_for_input'
              : 'pending',
          plan: continuingTask.plan?.map((originalStep) => {
            const matchingStep =
              result.plan.steps.find(
                (newStep) =>
                  newStep.toolCall?.toolId ===
                  originalStep.toolCall?.toolId,
              )

            if (
              originalStep.status !== 'blocked' ||
              !originalStep.toolCall ||
              !matchingStep?.toolCall
            ) {
              return {
                ...originalStep,
                dependsOn: originalStep.dependsOn
                  ? [...originalStep.dependsOn]
                  : undefined,
                missingInputs: originalStep.missingInputs
                  ? [...originalStep.missingInputs]
                  : undefined,
                toolCall: originalStep.toolCall
                  ? {
                      ...originalStep.toolCall,
                      arguments: {
                        ...originalStep.toolCall.arguments,
                      },
                    }
                  : undefined,
              }
            }

            return {
              ...originalStep,
              status: 'ready',
              missingInputs: [],
              toolCall: {
                ...originalStep.toolCall,
                arguments: {
                  ...originalStep.toolCall.arguments,
                  ...matchingStep.toolCall.arguments,
                },
              },
            }
          }),
          availableInformation: mergedInformation,
          missingInformation:
            generatedTask.missingInformation.filter(
              (missing) =>
                !mergedInformation.some(
                  (available) =>
                    available.key === missing.key,
                ),
            ),
        }
      : generatedTask

    this.taskManager.create(task)

    this.contextManager.update({
      taskId: task.id,
    })

    const planToExecute: NexoraPlan =
      isContinuation
        ? {
            ...result.plan,
            objective: continuingTask.objective,
            steps: task.plan ?? [],
          }
        : result.plan

    const planIssues =
      this.buildPlanIssues(planToExecute.steps)

    const planToolCalls =
      planToExecute.steps
        .map((step) => step.toolCall)
        .filter(
          (toolCall): toolCall is NexoraToolCall =>
            toolCall !== undefined,
        )

    const requiresConfirmation =
      planToExecute.requiresConfirmation ||
      planToolCalls.some((toolCall) => {
        const permission =
          this.permissionManager.getPermission(
            toolCall.toolId,
          )

        if (!permission) {
          return true
        }

        return (
          !permission.allowed ||
          permission.requiresConfirmation
        )
      })

    if (planIssues.length > 0) {
      const response =
        await this.engine.generateResponse({
          message: userMessage,
          context: engineContext,
          history,
          memoryContext,
          executionResults: [],
          interpretedExecutionResults: [],
          planIssues,
        })

      const assistantMessage: NexoraMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        createdAt: Date.now(),
      }

      this.conversationManager.addMessage(assistantMessage)

      return {
        message: assistantMessage,
        intent: result.interpretation.intent,
        toolCalls:
          planToolCalls.length > 0
            ? planToolCalls
            : undefined,
        requiresConfirmation: false,
      }
    }

    if (requiresConfirmation) {
      const pendingPlan: NexoraPendingPlan = {
        id: crypto.randomUUID(),
        plan: planToExecute,
        createdAt: Date.now(),
        userMessage,
        context: engineContext,
        memoryContext,
      }

      this.pendingPlan = pendingPlan

      const assistantMessage: NexoraMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'La solicitud requiere tu autorización antes de ejecutar la acción.',
        createdAt: Date.now(),
      }

      this.conversationManager.addMessage(assistantMessage)

      return {
        message: assistantMessage,
        intent: result.interpretation.intent,
        toolCalls:
          planToolCalls.length > 0
            ? planToolCalls
            : undefined,
        requiresConfirmation: true,
      }
    }

    this.taskManager.updateStatus(
      task.id,
      'in_progress',
    )

    const planExecution =
      await this.planExecutor.execute(planToExecute)

    const executionResults =
      planExecution.executionResults

    const hasFailedSteps =
      planExecution.plan.steps.some(
        (step) =>
          step.status === 'failed' ||
          step.status === 'blocked',
      )

    const currentTask = this.taskManager.get(task.id)

    if (currentTask) {
      this.taskManager.create({
        ...currentTask,
        plan: planExecution.plan.steps,
      })
    }

    this.taskManager.updateStatus(
      task.id,
      hasFailedSteps ? 'failed' : 'completed',
    )

    const interpretedExecutionResults: NexoraInterpretedExecutionResult[] =
      executionResults.map(
        (executionResult) =>
          this.resultInterpreter.interpret(
            executionResult,
          ),
      )

    const response =
      await this.engine.generateResponse({
        message: userMessage,
        context: engineContext,
        history,
        memoryContext,
        executionResults,
        interpretedExecutionResults,
      })

    const assistantMessage: NexoraMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.content,
      createdAt: Date.now(),
    }

    this.conversationManager.addMessage(assistantMessage)

    return {
      message: assistantMessage,
      intent: result.interpretation.intent,
      toolCalls:
        planToolCalls.length > 0
          ? planToolCalls
          : undefined,
      executionResults:
        executionResults.length > 0
          ? executionResults
          : undefined,
      requiresConfirmation: false,
    }
  }

  getPendingPlan(): NexoraPendingPlan | undefined {
    if (!this.pendingPlan) {
      return undefined
    }

    return {
      id: this.pendingPlan.id,
      plan: {
        ...this.pendingPlan.plan,
        steps: this.pendingPlan.plan.steps.map(
          (step) => ({
            ...step,
            dependsOn: step.dependsOn
              ? [...step.dependsOn]
              : undefined,
            toolCall: step.toolCall
              ? {
                  ...step.toolCall,
                  arguments: {
                    ...step.toolCall.arguments,
                  },
                }
              : undefined,
          }),
        ),
      },
      createdAt: this.pendingPlan.createdAt,
      userMessage: {
        ...this.pendingPlan.userMessage,
      },
      context: {
        ...this.pendingPlan.context,
        data: {
          ...this.pendingPlan.context.data,
        },
      },
      memoryContext: this.pendingPlan.memoryContext,
    }
  }

  async confirmPendingPlan(
    pendingPlanId: string,
  ): Promise<NexoraResponse> {
    if (!this.pendingPlan) {
      throw new Error(
        'No existe ningún plan pendiente de confirmación.',
      )
    }

    if (this.pendingPlan.id !== pendingPlanId) {
      throw new Error(
        'El plan pendiente ya no es válido.',
      )
    }

    const pendingPlan = this.pendingPlan

    const taskId =
      pendingPlan.context.taskId ??
      this.contextManager.get().taskId

    if (taskId) {
      this.taskManager.updateStatus(
        taskId,
        'in_progress',
      )
    }

    this.pendingPlan = undefined

    const result =
      await this.planExecutor.execute(
        pendingPlan.plan,
        {
          confirmed: true,
        },
      )

    const executionResults =
      result.executionResults

    const hasFailedSteps =
      result.plan.steps.some(
        (step) =>
          step.status === 'failed' ||
          step.status === 'blocked',
      )

    if (taskId) {
      const currentTask = this.taskManager.get(taskId)

      if (currentTask) {
        this.taskManager.create({
          ...currentTask,
          plan: result.plan.steps,
        })
      }

      this.taskManager.updateStatus(
        taskId,
        hasFailedSteps ? 'failed' : 'completed',
      )
    }

    const interpretedExecutionResults: NexoraInterpretedExecutionResult[] =
      executionResults.map(
        (executionResult) =>
          this.resultInterpreter.interpret(
            executionResult,
          ),
      )

    const response =
      await this.engine.generateResponse({
        message: pendingPlan.userMessage,
        context: pendingPlan.context,
        history: this.conversationManager.getMessages(),
        memoryContext: pendingPlan.memoryContext,
        executionResults,
        interpretedExecutionResults,
      })

    const assistantMessage: NexoraMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.content,
      createdAt: Date.now(),
    }

    this.conversationManager.addMessage(assistantMessage)

    return {
      message: assistantMessage,
      toolCalls: pendingPlan.plan.steps
        .map((step) => step.toolCall)
        .filter(
          (toolCall): toolCall is NexoraToolCall =>
            toolCall !== undefined,
        ),
      executionResults:
        executionResults.length > 0
          ? executionResults
          : undefined,
      requiresConfirmation: false,
    }
  }

  clearPendingPlan(): void {
    this.pendingPlan = undefined
  }

  getTools(): ReturnType<
    NexoraToolRegistry['getAll']
  > {
    return this.toolRegistry.getAll()
  }

  getContext(): NexoraContext {
    return this.contextManager.get()
  }

  getTasks(): NexoraTask[] {
    return this.taskManager.getAll()
  }

  getConversation(): NexoraMessage[] {
    return this.conversationManager.getMessages()
  }

  async remember(
    input: Parameters<
      NexoraMemoryManager['remember']
    >[0],
  ): Promise<NexoraMemory> {
    return this.memoryManager.remember(input)
  }

  async findMemory(
    key: string,
  ): Promise<NexoraMemory[]> {
    return this.memoryManager.find(key)
  }

  async retrieveMemories(
    query: string,
  ): Promise<NexoraMemory[]> {
    return this.memoryManager.retrieve(query)
  }

  async getMemories(): Promise<NexoraMemory[]> {
    return this.memoryManager.getAll()
  }

  async removeMemory(id: string): Promise<void> {
    await this.memoryManager.remove(id)
  }

  clearContext(): void {
    this.contextManager.clear()
  }

  clearConversation(): void {
    this.conversationManager.clear()
  }

  async clearMemories(): Promise<void> {
    await this.memoryManager.clear()
  }

  private buildPlanIssues(
    steps: NexoraPlanStep[],
  ): NexoraAIPlanIssue[] {
    return steps
      .filter((step) => step.status === 'blocked')
      .map((step) => ({
        type: 'blocked',
        stepId: step.id,
        toolId: step.toolCall?.toolId,
        missingInputs: step.missingInputs,
        description: step.description,
      }))
  }
}
