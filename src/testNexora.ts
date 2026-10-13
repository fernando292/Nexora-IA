
import { NexoraCore } from './core/NexoraCore'
import type {
  NexoraEngine,
  NexoraEngineInput,
  NexoraEngineResponseInput,
  NexoraEngineResult,
} from './core/NexoraEngine'
import type {
  NexoraPlan,
} from './core/NexoraPlanner'
import type {
  NexoraAIResponse,
} from './ai/NexoraAIProvider'
import type {
  NexoraIntent,
  NexoraToolCall,
} from './core/types'
import { NexoraPermissionManager } from './core/NexoraPermissionManager'
import { NexoraToolRegistry } from './core/NexoraToolRegistry'
import { testEchoTool } from './tools/TestEchoTool'

const originalPlan: NexoraPlan = {
  objective: 'Completar una tarea de varios pasos',
  requiresConfirmation: false,
  steps: [
    {
      id: 'step-1',
      type: 'tool',
      description: 'Consultar el cliente',
      status: 'blocked',
      toolCall: {
        toolId: 'test.echo',
        arguments: {},
      },
      missingInputs: ['clientId'],
    },
    {
      id: 'step-2',
      type: 'reasoning',
      description: 'Procesar los datos del cliente',
      status: 'pending',
      dependsOn: ['step-1'],
    },
    {
      id: 'step-3',
      type: 'response',
      description: 'Presentar el resultado',
      status: 'pending',
      dependsOn: ['step-2'],
    },
  ],
}

function createIntent(
  entities: NexoraIntent['entities'] = [],
): NexoraIntent {
  return {
    type: 'execute',
    confidence: 1,
    description: 'Completar una tarea de varios pasos',
    ambiguous: false,
    requiresClarification: false,
    entities,
  }
}

class ControlledEngine implements NexoraEngine {
  private callCount = 0

  async process(
    input: NexoraEngineInput,
  ): Promise<NexoraEngineResult> {
    this.callCount += 1

    if (this.callCount === 1) {
      return {
        interpretation: {
          intent: createIntent(),
          entities: {},
          toolCalls: [
            {
              toolId: 'test.echo',
              arguments: {},
            },
          ],
          context: input.context ?? {},
        },
        plan: {
          ...originalPlan,
          steps: originalPlan.steps.map((step) => ({
            ...step,
            dependsOn: step.dependsOn
              ? [...step.dependsOn]
              : undefined,
            missingInputs: step.missingInputs
              ? [...step.missingInputs]
              : undefined,
            toolCall: step.toolCall
              ? {
                  ...step.toolCall,
                  arguments: {
                    ...step.toolCall.arguments,
                  },
                }
              : undefined,
          })),
        },
      }
    }

    const activeTask = input.context?.data?.activeTask

    if (!activeTask || typeof activeTask !== 'object') {
      throw new Error(
        'No se recibió la tarea activa durante la continuación.',
      )
    }

    const toolCall: NexoraToolCall = {
      toolId: 'test.echo',
      arguments: {
        clientId: 'CLIENTE-123',
      },
    }

    return {
      interpretation: {
        intent: createIntent([
          {
            key: 'clientId',
            value: 'CLIENTE-123',
          },
        ]),
        entities: {
          clientId: 'CLIENTE-123',
        },
        toolCalls: [toolCall],
        context: input.context ?? {},
      },
      plan: {
        objective: 'Continuar la tarea',
        requiresConfirmation: false,
        steps: [
          {
            id: 'continuation-step',
            type: 'tool',
            description: 'Consultar el cliente',
            status: 'ready',
            toolCall,
          },
        ],
      },
    }
  }

  async generateResponse(
    _input: NexoraEngineResponseInput,
  ): Promise<NexoraAIResponse> {
    return {
      content: 'Respuesta de prueba.',
    }
  }
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function testMultiStepContinuity() {
  const toolRegistry = new NexoraToolRegistry()
  toolRegistry.register(testEchoTool)

  const permissionManager = new NexoraPermissionManager()
  permissionManager.setPermission({
    toolId: 'test.echo',
    allowed: true,
    requiresConfirmation: false,
  })

  const core = new NexoraCore({
    engine: new ControlledEngine(),
    toolRegistry,
    permissionManager,
  })

  console.log('TEST 1: Crear tarea multipaso')

  await core.process({
    content: 'Inicia la tarea de varios pasos',
  })

  const taskId = core.getContext().taskId
  assert(taskId, 'No se creó la tarea inicial.')

  const initialTask = core.getTasks().find(
    (task) => task.id === taskId,
  )

  assert(
    initialTask?.status === 'waiting_for_input',
    `Se esperaba waiting_for_input; se obtuvo ${initialTask?.status}.`,
  )

  assert(
    initialTask.plan?.length === 3,
    'La tarea inicial no conserva los tres pasos esperados.',
  )

  console.log('Tarea inicial:', taskId)
  console.log('Pasos iniciales:', initialTask.plan.length)

  console.log('TEST 2: Continuar con CLIENTE-123')

  const continuation = await core.process({
    content: 'CLIENTE-123',
  })

  const continuedTask = core.getTasks().find(
    (task) => task.id === taskId,
  )

  assert(
    continuedTask,
    'La tarea original desapareció después de continuar.',
  )

  const steps = continuedTask.plan ?? []
  const step1 = steps.find((step) => step.id === 'step-1')
  const step2 = steps.find((step) => step.id === 'step-2')
  const step3 = steps.find((step) => step.id === 'step-3')

  assert(step1 && step2 && step3, 'Se perdieron pasos originales.')

  assert(
    step1.toolCall?.arguments.clientId === 'CLIENTE-123',
    'El identificador no quedó guardado en el paso original.',
  )

  assert(
    !step1.missingInputs?.includes('clientId'),
    'El paso sigue solicitando clientId después de recibirlo.',
  )

  assert(
    step2.dependsOn?.includes('step-1'),
    'Se perdió la dependencia step-2 → step-1.',
  )

  assert(
    step3.dependsOn?.includes('step-2'),
    'Se perdió la dependencia step-3 → step-2.',
  )

  const executionResult = continuation.executionResults?.find(
    (result) => result.toolId === 'test.echo',
  )

  assert(
    executionResult?.success === true,
    `test.echo no se ejecutó correctamente: ${executionResult?.error ?? 'sin resultado de ejecución'}.`,
  )

  const resultData = executionResult.result

  assert(
    typeof resultData === 'object' &&
      resultData !== null &&
      'customer' in resultData &&
      typeof resultData.customer === 'object' &&
      resultData.customer !== null &&
      'id' in resultData.customer &&
      resultData.customer.id === 'CLIENTE-123',
    'La herramienta no devolvió el cliente esperado.',
  )

  assert(
    continuedTask.status === 'completed',
    `Se esperaba completed; se obtuvo ${continuedTask.status}.`,
  )

  assert(
    steps.every((step) => step.status === 'completed'),
    `No todos los pasos terminaron correctamente: ${steps
      .map((step) => `${step.id}=${step.status}`)
      .join(', ')}`,
  )

  console.log('Estado final:', continuedTask.status)
  console.log(
    'Pasos finales:',
    steps.map((step) => ({
      id: step.id,
      status: step.status,
      dependsOn: step.dependsOn,
    })),
  )
  console.log('Resultado test.echo:', resultData)
  console.log('PRUEBA DE CONTINUIDAD MULTIPASO SUPERADA.')
}

testMultiStepContinuity().catch((error: unknown) => {
  console.error('PRUEBA FALLIDA:', error)
  process.exitCode = 1
})
