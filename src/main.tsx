
import { DefaultNexoraEngine } from './core/NexoraEngine'
import { NexoraCore } from './core/NexoraCore'
import { AIBackedNexoraInterpreter } from './core/NexoraInterpreter'
import { DefaultNexoraPlanner } from './core/NexoraPlanner'
import {
  NexoraPermissionManager,
} from './core/NexoraPermissionManager'
import {
  NexoraToolRegistry,
} from './core/NexoraToolRegistry'
import {
  testEchoTool,
} from './tools/TestEchoTool'
import type {
  NexoraAIProvider,
  NexoraAIRequest,
  NexoraAIResponse,
} from './ai/NexoraAIProvider'

const aiProvider: NexoraAIProvider = {
  async generate(
    request: NexoraAIRequest,
  ): Promise<NexoraAIResponse> {
    const lastMessage =
      request.messages.at(-1)

    const content =
      lastMessage?.content.trim() ?? ''

    if (
      content.toLowerCase() ===
      'ejecuta test.echo'
    ) {
      if (
        request.executionResults &&
        request.executionResults.length > 0
      ) {
        return {
          content:
            'La herramienta test.echo se ejecutó correctamente después de la confirmación.',
        }
      }

      return {
        content:
          'La acción requiere confirmación.',
        intent: {
          type: 'action',
          confidence: 1,
          description:
            'El usuario solicita ejecutar una herramienta.',
          goal:
            'Ejecutar test.echo',
          entities: [],
          ambiguous: false,
          requiresClarification: false,
        },
        toolCalls: [
          {
            toolId: 'test.echo',
            arguments: {
              clientId:
                'cliente-prueba',
            },
          },
        ],
      }
    }

    return {
      content:
        `Solicitud recibida: "${content}"`,
    }
  },
}

const interpreter =
  new AIBackedNexoraInterpreter(
    aiProvider,
  )

const planner =
  new DefaultNexoraPlanner()

const toolRegistry =
  new NexoraToolRegistry()

toolRegistry.register(
  testEchoTool,
)

const permissionManager =
  new NexoraPermissionManager()

permissionManager.setPermission({
  toolId: 'test.echo',
  allowed: true,
  requiresConfirmation: true,
})

const engine =
  new DefaultNexoraEngine({
    interpreter,
    planner,
    aiProvider,
    getAvailableTools: () =>
      toolRegistry.getAll().map(
        (tool) => tool.definition,
      ),
  })

const nexora =
  new NexoraCore({
    engine,
    toolRegistry,
    permissionManager,
  })

async function runTest() {
  const firstResponse =
    await nexora.process({
      content:
        'Ejecuta test.echo',
    })

  const pendingPlan =
    nexora.getPendingPlan()

  const contextBefore =
    nexora.getContext()

  const taskId =
    contextBefore.taskId

  const taskBefore =
    taskId
      ? nexora
          .getTasks()
          .find(
            (item) =>
              item.id === taskId,
          )
      : undefined

  console.log(
    'NEXORA CONFIRMATION RESPONSE:',
    firstResponse.message.content,
  )

  console.log(
    'NEXORA CONFIRMATION REQUIRED:',
    firstResponse.requiresConfirmation,
  )

  console.log(
    'NEXORA PENDING PLAN:',
    pendingPlan,
  )

  console.log(
    'NEXORA TASK BEFORE CONFIRMATION:',
    taskBefore,
  )

  if (!pendingPlan) {
    console.log(
      'NEXORA CONFIRMATION TEST PASSED:',
      false,
    )

    return
  }

  const confirmedResponse =
    await nexora.confirmPendingPlan(
      pendingPlan.id,
    )

  const taskAfter =
    taskId
      ? nexora
          .getTasks()
          .find(
            (item) =>
              item.id === taskId,
          )
      : undefined

  console.log(
    'NEXORA CONFIRMED RESPONSE:',
    confirmedResponse.message.content,
  )

  console.log(
    'NEXORA TASK AFTER CONFIRMATION:',
    taskAfter,
  )

  console.log(
    'NEXORA TASK AFTER STATUS:',
    taskAfter?.status,
  )

  console.log(
    'NEXORA CONFIRMATION TEST PASSED:',
    Boolean(
      firstResponse.requiresConfirmation ===
        true &&
        pendingPlan &&
        taskBefore?.status ===
          'pending' &&
        confirmedResponse.executionResults?.some(
          (result) =>
            result.success === true,
        ) &&
        taskAfter?.status ===
          'completed',
    ),
  )
}

runTest()
