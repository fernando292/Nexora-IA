import type {
  NexoraAIProvider,
  NexoraAIRequest,
  NexoraAIResponse,
} from './NexoraAIProvider'

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
          responseStage:
            'plan-clarification',
          planIssueType:
            blockedIssue.type,
        },
      }
    }

    if (
      content.toLowerCase() ===
      'ejecuta test.echo'
    ) {
      const interpretedResults =
        request.interpretedExecutionResults ?? []

      if (interpretedResults.length > 0) {
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
            arguments: {
              message: 'Hola Nexora',
            },
          },
        ],
        metadata: {
          provider: 'mock',
          mode: 'development',
        },
      }
    }

    return {
      content: lastMessage
        ? `Solicitud recibida: "${lastMessage.content}"`
        : 'No se recibió ningún mensaje.',
      intent: {
        type: 'question',
        confidence: 0.95,
        description:
          'El usuario está realizando una consulta.',
        goal: lastMessage?.content,
        entities: [],
        ambiguous: false,
        requiresClarification: false,
      },
      metadata: {
        provider: 'mock',
        mode: 'development',
      },
    }
  }
}
