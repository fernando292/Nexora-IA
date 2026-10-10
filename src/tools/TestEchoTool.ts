import type {
  NexoraTool,
  NexoraToolDefinition,
} from '../core/NexoraToolRegistry'
import type {
  NexoraToolCall,
} from '../core/types'

const definition: NexoraToolDefinition = {
  id: 'test.echo',
  name: 'Test Echo',
  description:
    'Herramienta interna para comprobar la ejecución de herramientas de Nexora.',
  requiresConfirmation: false,
  inputs: [
    {
      name: 'clientId',
      description:
        'Identificador del cliente que se desea procesar.',
      required: true,
      semanticType: 'customerId',
    },
  ],
  outputs: [
    {
      path: 'customer.id',
      description:
        'Identificador único del cliente procesado.',
      semanticType: 'customerId',
    },
  ],
}

export const testEchoTool: NexoraTool = {
  definition,

  async execute(
    call: NexoraToolCall,
  ): Promise<unknown> {
    const clientId =
      call.arguments.clientId

    if (
      typeof clientId !== 'string'
    ) {
      throw new Error(
        'La herramienta test.echo requiere un argumento "clientId" de tipo texto.',
      )
    }

    return {
      customer: {
        id: clientId,
      },
    }
  },
}
