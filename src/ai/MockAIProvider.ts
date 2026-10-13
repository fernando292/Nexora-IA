
import type {
  NexoraAIProvider,
  NexoraAIRequest,
  NexoraAIResponse,
} from './NexoraAIProvider'
import type {
  NexoraToolCall,
} from '../core/types'

interface MockTaskInformation {
  key: string
  reason?: string
}

interface MockTaskPlanStep {
  status: string
  missingInputs?: string[]
  toolCall?: NexoraToolCall
}

interface MockActiveTask {
  id: string
  objective: string
  status: string
  missingInformation: MockTaskInformation[]
  availableInformation?: Array<{
    key: string
    value: unknown
    source: string
  }>
  plan?: MockTaskPlanStep[]
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function getActiveTask(
  contextData: unknown,
): MockActiveTask | undefined {
  if (!isRecord(contextData)) {
    return undefined
  }

  const candidate = contextData.activeTask

  if (!isRecord(candidate)) {
    return undefined
  }

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.objective !== 'string' ||
    typeof candidate.status !== 'string' ||
    !Array.isArray(candidate.missingInformation)
  ) {
    return undefined
  }

  const missingInformation =
    candidate.missingInformation.filter(
      (item): item is MockTaskInformation =>
        isRecord(item) &&
        typeof item.key === 'string',
    )

  const plan = Array.isArray(candidate.plan)
    ? candidate.plan.filter(
        (step): step is MockTaskPlanStep =>
          isRecord(step) &&
          typeof step.status === 'string',
      )
    : undefined

  return {
    id: candidate.id,
    objective: candidate.objective,
    status: candidate.status,
    missingInformation,
    availableInformation:
      Array.isArray(candidate.availableInformation)
        ? candidate.availableInformation.filter(
            (item): item is {
              key: string
              value: unknown
              source: string
            } =>
              isRecord(item) &&
              typeof item.key === 'string' &&
              typeof item.source === 'string',
          )
        : undefined,
    plan,
  }
}

/**
 * Valida el formato básico de un identificador.
 * No sustituye la validación real que debe realizar
 * cada herramienta cuando se conecten datos reales.
 */
function isSimpleIdentifier(
  value: string,
): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(value)
}

export class MockAIProvider
  implements NexoraAIProvider
{
  async generate(
    request: NexoraAIRequest,
  ): Promise<NexoraAIResponse> {
    console.log(
      'NEXORA AI REQUEST CONTEXT:',
      request.context,
    )

    console.log(
      'NEXORA AI EXECUTION RESULTS:',
      request.executionResults,
    )

    console.log(
      'NEXORA INTERPRETED EXECUTION RESULTS:',
      request.interpretedExecutionResults,
    )

    console.log(
      'NEXORA AI PLAN ISSUES:',
      request.planIssues,
    )

    const lastMessage =
      request.messages.at(-1)

    const content =
      lastMessage?.content.trim() ?? ''

    const normalizedContent =
      content.toLowerCase()

    const planIssues =
      request.planIssues ?? []

    const blockedIssue =
      planIssues.find(
        (issue) =>
          issue.type === 'blocked' &&
          (issue.missingInputs?.length ?? 0) > 0,
      )

    if (blockedIssue) {
      const missingInputs =
        blockedIssue.missingInputs ?? []

      return {
        content:
          `Necesito información adicional para continuar. Faltan estos datos: ${missingInputs.join(', ')}.`,
        metadata: {
          provider: 'mock',
          mode: 'development',
          responseStage: 'plan-clarification',
          planIssueType: blockedIssue.type,
        },
      }
    }

    const interpretedResults =
      request.interpretedExecutionResults ?? []

    if (
      interpretedResults.length > 0 &&
    (
    normalizedContent === 'ejecuta test.echo' ||
    request.context?.data &&
    isRecord(request.context.data) &&
    isRecord(request.context.data.activeTask) &&
    request.context.data.activeTask.status === 'waiting_for_input'
    )
  ) {
      const interpreted =
        interpretedResults[0]

      if (interpreted.success) {
        return {
          content:
            `${interpreted.summary} Datos obtenidos: ${JSON.stringify(
              interpreted.data,
            )}`,
          metadata: {
            provider: 'mock',
            mode: 'development',
            responseStage:
              'interpreted-execution-result',
          },
        }
      }

      return {
        content:
          `${interpreted.summary} ${interpreted.error ?? 'Error desconocido.'}`,
        metadata: {
          provider: 'mock',
          mode: 'development',
          responseStage:
            'interpreted-execution-result',
        },
      }
    }

    const activeTask = getActiveTask(
      request.context?.data,
    )

    if (
      request.responseFormat === 'structured' &&
      activeTask?.status === 'waiting_for_input' &&
      activeTask.missingInformation.length === 1 &&
      content.length > 0 &&
      normalizedContent !== 'ejecuta test.echo' &&
      isSimpleIdentifier(content)
    ) {
      const missingKey =
        activeTask.missingInformation[0].key

      const blockedStep =
        activeTask.plan?.find(
          (step) =>
            step.status === 'blocked' &&
            step.missingInputs?.includes(missingKey) &&
            step.toolCall !== undefined,
        )

      if (blockedStep?.toolCall) {
        const updatedToolCall: NexoraToolCall = {
          ...blockedStep.toolCall,
          arguments: {
            ...blockedStep.toolCall.arguments,
            [missingKey]: content,
          },
        }

        return {
          content:
            'He recibido el dato pendiente y continuaré con la tarea existente.',
          intent: {
            type: 'action',
            confidence: 0.8,
            description:
              'El usuario aporta información para continuar una tarea pendiente.',
            goal: activeTask.objective,
            entities: [
              {
                key: missingKey,
                value: content,
                confidence: 0.8,
              },
            ],
            ambiguous: false,
            requiresClarification: false,
          },
          toolCalls: [updatedToolCall],
          metadata: {
            provider: 'mock',
            mode: 'development',
            responseStage: 'task-continuation',
            taskId: activeTask.id,
          },
        }
      }
    }

    if (
      request.responseFormat === 'structured' &&
      normalizedContent === 'ejecuta test.echo'
    ) {
      return {
        content:
          'Se solicita ejecutar la herramienta de prueba.',
        intent: {
          type: 'action',
          confidence: 0.99,
          description:
            'El usuario solicita ejecutar una herramienta de prueba.',
          goal: 'Ejecutar test.echo',
          entities: [],
          ambiguous: false,
          requiresClarification: false,
        },
        toolCalls: [
          {
            toolId: 'test.echo',
            arguments: {},
          },
        ],
        metadata: {
          provider: 'mock',
          mode: 'development',
          responseStage: 'test-tool-request',
        },
      }
    }

    return {
      content: activeTask?.status === 'waiting_for_input'
        ? 'La tarea sigue pendiente. Para continuar, proporciona el identificador solicitado en un formato válido.'
        : lastMessage
          ? `Solicitud recibida: "${lastMessage.content}"`
          : 'No se recibió ningún mensaje.',
      intent: {
        type: activeTask?.status === 'waiting_for_input'
          ? 'clarification'
          : 'question',
        confidence: 0.5,
        description:
          'El proveedor simulado no pudo confirmar una continuación válida.',
        goal: lastMessage?.content,
        entities: [],
        ambiguous: true,
        requiresClarification: true,
      },
      metadata: {
        provider: 'mock',
        mode: 'development',
        responseStage: 'fallback',
      },
    }
  }
}
