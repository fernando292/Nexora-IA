import type {
  NexoraContext,
  NexoraIntent,
  NexoraStepOutputReference,
  NexoraToolCall,
  NexoraToolDefinition,
} from './types'

export type NexoraPlanStepType =
  | 'reasoning'
  | 'tool'
  | 'response'

export type NexoraPlanStepStatus =
  | 'pending'
  | 'ready'
  | 'completed'
  | 'failed'
  | 'blocked'

export interface NexoraPlan {
  objective: string
  steps: NexoraPlanStep[]
  requiresConfirmation: boolean
}

export interface NexoraPlanStep {
  id: string
  type: NexoraPlanStepType
  description: string
  status: NexoraPlanStepStatus
  dependsOn?: string[]
  toolCall?: NexoraToolCall
  inputMappings?: Record<
    string,
    NexoraStepOutputReference
  >
  missingInputs?: string[]
}

export interface NexoraPlannerInput {
  intent: NexoraIntent
  toolCalls?: NexoraToolCall[]
  availableTools?: NexoraToolDefinition[]
  context?: NexoraContext
}

export interface NexoraPlanner {
  plan(
    input: NexoraPlannerInput,
  ): Promise<NexoraPlan>
}

export class DefaultNexoraPlanner
  implements NexoraPlanner
{
  async plan(
    input: NexoraPlannerInput,
  ): Promise<NexoraPlan> {
    const {
      intent,
      toolCalls = [],
      availableTools = [],
    } = input

    const objective =
      intent.goal?.trim() ||
      intent.description?.trim() ||
      `Procesar intención: ${intent.type}`

    if (
      intent.requiresClarification ||
      intent.ambiguous
    ) {
      return {
        objective,
        steps: [
          {
            id: 'step-1',
            type: 'reasoning',
            description:
              'Solicitar aclaración antes de continuar.',
            status: 'blocked',
          },
        ],
        requiresConfirmation: false,
      }
    }

    if (toolCalls.length === 0) {
      return {
        objective,
        steps: [
          {
            id: 'step-1',
            type: 'reasoning',
            description:
              `Procesar intención: ${intent.type}`,
            status: 'ready',
          },
          {
            id: 'step-2',
            type: 'response',
            description:
              'Preparar respuesta para el usuario.',
            status: 'pending',
            dependsOn: ['step-1'],
          },
        ],
        requiresConfirmation: false,
      }
    }

    const steps: NexoraPlanStep[] = []
    let requiresConfirmation = false

    for (
      let index = 0;
      index < toolCalls.length;
      index += 1
    ) {
      const toolCall = toolCalls[index]

      const tool = availableTools.find(
        (candidate) =>
          candidate.id === toolCall.toolId,
      )

      const stepId =
        `step-${index + 1}`

      const previousStepId =
        index > 0
          ? `step-${index}`
          : undefined

      if (!tool) {
        steps.push({
          id: stepId,
          type: 'tool',
          description:
            `La herramienta "${toolCall.toolId}" no está disponible.`,
          status: 'failed',
          ...(previousStepId
            ? {
                dependsOn: [
                  previousStepId,
                ],
              }
            : {}),
          toolCall,
        })

        continue
      }

      const inputMappings =
        this.buildInputMappings(
          tool,
          toolCall,
          steps,
          availableTools,
        )

      const missingRequiredInputs =
        this.findMissingRequiredInputs(
          tool,
          toolCall,
          inputMappings,
        )

      const dependencies =
        this.buildDependencies(
          previousStepId,
          inputMappings,
        )

      const isBlocked =
        missingRequiredInputs.length > 0

      steps.push({
        id: stepId,
        type: 'tool',
        description: isBlocked
          ? `La herramienta "${tool.name}" requiere información que todavía no está disponible: ${missingRequiredInputs.join(', ')}.`
          : `Ejecutar herramienta: ${tool.name}`,
        status: isBlocked
          ? 'blocked'
          : 'ready',
        ...(dependencies.length > 0
          ? {
              dependsOn:
                dependencies,
            }
          : {}),
        ...(Object.keys(
          inputMappings,
        ).length > 0
          ? {
              inputMappings,
            }
          : {}),
        ...(isBlocked
          ? {
              missingInputs:
                missingRequiredInputs,
            }
          : {}),
        toolCall,
      })

      if (tool.requiresConfirmation) {
        requiresConfirmation = true
      }
    }

    if (steps.length === 0) {
      steps.push({
        id: 'step-1',
        type: 'reasoning',
        description:
          'No se encontraron herramientas disponibles para ejecutar la solicitud.',
        status: 'failed',
      })

      return {
        objective,
        steps,
        requiresConfirmation,
      }
    }

    const toolStepIds = steps
      .filter(
        (step) =>
          step.type === 'tool',
      )
      .map(
        (step) => step.id,
      )

    const responseStepId =
      `step-${steps.length + 1}`

    steps.push({
      id: responseStepId,
      type: 'response',
      description:
        'Preparar respuesta a partir de los resultados obtenidos.',
      status: 'pending',
      dependsOn:
        toolStepIds.length > 0
          ? toolStepIds
          : undefined,
    })

    return {
      objective,
      steps,
      requiresConfirmation,
    }
  }

  private buildInputMappings(
    tool: NexoraToolDefinition,
    toolCall: NexoraToolCall,
    previousSteps: NexoraPlanStep[],
    availableTools: NexoraToolDefinition[],
  ): Record<
    string,
    NexoraStepOutputReference
  > {
    const mappings: Record<
      string,
      NexoraStepOutputReference
    > = {}

    if (
      !tool.inputs ||
      tool.inputs.length === 0 ||
      previousSteps.length === 0
    ) {
      return mappings
    }

    for (const input of tool.inputs) {
      const argumentValue =
        toolCall.arguments[input.name]

      if (
        argumentValue !== undefined &&
        argumentValue !== null
      ) {
        continue
      }

      const source =
        this.findOutputSource(
          input.name,
          input.semanticType,
          previousSteps,
          availableTools,
        )

      if (!source) {
        continue
      }

      mappings[input.name] = {
        stepId: source.stepId,
        path: source.path,
      }
    }

    return mappings
  }

  private findMissingRequiredInputs(
    tool: NexoraToolDefinition,
    toolCall: NexoraToolCall,
    inputMappings: Record<
      string,
      NexoraStepOutputReference
    >,
  ): string[] {
    if (
      !tool.inputs ||
      tool.inputs.length === 0
    ) {
      return []
    }

    return tool.inputs
      .filter((input) => {
        if (input.required !== true) {
          return false
        }

        const argumentValue =
          toolCall.arguments[input.name]

        const argumentMissing =
          argumentValue === undefined ||
          argumentValue === null

        const mappingMissing =
          inputMappings[input.name] ===
          undefined

        return (
          argumentMissing &&
          mappingMissing
        )
      })
      .map(
        (input) => input.name,
      )
  }

  private findOutputSource(
    inputName: string,
    inputSemanticType:
      | string
      | undefined,
    previousSteps: NexoraPlanStep[],
    availableTools: NexoraToolDefinition[],
  ): NexoraStepOutputReference | undefined {
    for (
      let index =
        previousSteps.length - 1;
      index >= 0;
      index -= 1
    ) {
      const step =
        previousSteps[index]

      if (
        step.type !== 'tool' ||
        !step.toolCall
      ) {
        continue
      }

      const sourceTool =
        availableTools.find(
          (tool) =>
            tool.id ===
            step.toolCall?.toolId,
        )

      if (
        !sourceTool?.outputs ||
        sourceTool.outputs.length === 0
      ) {
        continue
      }

      const output =
        sourceTool.outputs.find(
          (candidate) => {
            if (
              inputSemanticType &&
              candidate.semanticType
            ) {
              return (
                candidate.semanticType ===
                inputSemanticType
              )
            }

            return (
              candidate.path ===
              inputName
            )
          },
        )

      if (!output) {
        continue
      }

      return {
        stepId: step.id,
        path: output.path,
      }
    }

    return undefined
  }

  private buildDependencies(
    previousStepId:
      | string
      | undefined,
    inputMappings: Record<
      string,
      NexoraStepOutputReference
    >,
  ): string[] {
    const dependencies =
      new Set<string>()

    if (previousStepId) {
      dependencies.add(
        previousStepId,
      )
    }

    for (const reference of Object.values(
      inputMappings,
    )) {
      dependencies.add(
        reference.stepId,
      )
    }

    return Array.from(
      dependencies,
    )
  }
}
