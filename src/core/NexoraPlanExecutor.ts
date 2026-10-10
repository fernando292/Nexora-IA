import type {
  NexoraExecutionResult,
  NexoraStepOutputReference,
  NexoraToolCall,
} from './types'

import type {
  NexoraPlan,
  NexoraPlanStep,
} from './NexoraPlanner'

import { NexoraExecutor } from './NexoraExecutor'

export interface NexoraPlanExecutionOptions {
  confirmed?: boolean
}

export interface NexoraPlanExecutionResult {
  plan: NexoraPlan
  executionResults: NexoraExecutionResult[]
}

export class NexoraPlanExecutor {
  constructor(
    private readonly executor: NexoraExecutor,
  ) {}

  async execute(
    plan: NexoraPlan,
    options: NexoraPlanExecutionOptions = {},
  ): Promise<NexoraPlanExecutionResult> {
    const steps =
      plan.steps.map((step) => ({
        ...step,
        dependsOn: step.dependsOn
          ? [...step.dependsOn]
          : undefined,
        inputMappings: step.inputMappings
          ? {
              ...step.inputMappings,
            }
          : undefined,
        toolCall: step.toolCall
          ? {
              ...step.toolCall,
              arguments: {
                ...step.toolCall.arguments,
              },
            }
          : undefined,
      }))

    const executionResults: NexoraExecutionResult[] = []

    const stepResults =
      new Map<
        string,
        NexoraExecutionResult
      >()

    let hasProgress = true

    while (hasProgress) {
      hasProgress = false

      this.updateStepReadiness(steps)
      this.updateBlockedSteps(steps)

      for (const step of steps) {
        if (step.status !== 'ready') {
          continue
        }

        if (
          !this.dependenciesCompleted(
            step,
            steps,
          )
        ) {
          continue
        }

        if (!step.toolCall) {
          step.status = 'completed'
          hasProgress = true
          continue
        }

        let toolCall: NexoraToolCall

        try {
          toolCall =
            this.resolveToolCall(
              step.toolCall,
              step.inputMappings,
              stepResults,
            )
        } catch (error) {
          const result: NexoraExecutionResult = {
            toolId:
              step.toolCall.toolId,
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'No se pudieron resolver las entradas del paso.',
          }

          executionResults.push(result)
          stepResults.set(
            step.id,
            result,
          )

          step.status = 'failed'
          hasProgress = true

          this.updateBlockedSteps(
            steps,
          )

          continue
        }

        const result =
          await this.executor.execute(
            toolCall,
            {
              confirmed:
                options.confirmed === true,
            },
          )

        executionResults.push(result)

        stepResults.set(
          step.id,
          result,
        )

        step.status = result.success
          ? 'completed'
          : 'failed'

        hasProgress = true

        if (!result.success) {
          this.updateBlockedSteps(
            steps,
          )
        }
      }

      this.updateStepReadiness(steps)
      this.updateBlockedSteps(steps)
    }

    return {
      plan: {
        ...plan,
        steps,
      },
      executionResults,
    }
  }

  private resolveToolCall(
    toolCall: NexoraToolCall,
    inputMappings:
      | Record<
          string,
          NexoraStepOutputReference
        >
      | undefined,
    stepResults: Map<
      string,
      NexoraExecutionResult
    >,
  ): NexoraToolCall {
    if (!inputMappings) {
      return {
        ...toolCall,
        arguments: {
          ...toolCall.arguments,
        },
      }
    }

    const argumentsCopy = {
      ...toolCall.arguments,
    }

    for (
      const [
        argumentName,
        reference,
      ] of Object.entries(
        inputMappings,
      )
    ) {
      const result =
        stepResults.get(
          reference.stepId,
        )

      if (!result) {
        throw new Error(
          `No existe un resultado disponible para el paso "${reference.stepId}".`,
        )
      }

      if (!result.success) {
        throw new Error(
          `El paso "${reference.stepId}" no se ejecutó correctamente.`,
        )
      }

      const value =
        this.resolvePath(
          result.result,
          reference.path,
        )

      if (value === undefined) {
        throw new Error(
          `No se encontró el valor solicitado en el resultado del paso "${reference.stepId}".`,
        )
      }

      argumentsCopy[
        argumentName
      ] = value
    }

    return {
      ...toolCall,
      arguments: argumentsCopy,
    }
  }

  private resolvePath(
    value: unknown,
    path?: string,
  ): unknown {
    if (!path) {
      return value
    }

    const segments =
      path
        .split('.')
        .filter(
          (segment) =>
            segment.length > 0,
        )

    let current: unknown =
      value

    for (const segment of segments) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== 'object'
      ) {
        return undefined
      }

      if (
        !Object.prototype.hasOwnProperty.call(
          current,
          segment,
        )
      ) {
        return undefined
      }

      current = (
        current as Record<
          string,
          unknown
        >
      )[segment]
    }

    return current
  }

  private dependenciesCompleted(
    step: NexoraPlanStep,
    steps: NexoraPlanStep[],
  ): boolean {
    if (
      !step.dependsOn ||
      step.dependsOn.length === 0
    ) {
      return true
    }

    return step.dependsOn.every(
      (dependencyId) =>
        steps.find(
          (candidate) =>
            candidate.id === dependencyId,
        )?.status === 'completed',
    )
  }

  private updateStepReadiness(
    steps: NexoraPlanStep[],
  ): void {
    for (const step of steps) {
      if (step.status !== 'pending') {
        continue
      }

      const dependencies =
        step.dependsOn ?? []

      if (dependencies.length === 0) {
        step.status = 'ready'
        continue
      }

      const dependencySteps =
        dependencies.map(
          (dependencyId) =>
            steps.find(
              (candidate) =>
                candidate.id ===
                dependencyId,
            ),
        )

      if (
        dependencySteps.some(
          (dependency) =>
            dependency === undefined ||
            dependency.status === 'failed',
        )
      ) {
        step.status = 'failed'
        continue
      }

      if (
        dependencySteps.some(
          (dependency) =>
            dependency?.status ===
            'blocked',
        )
      ) {
        step.status = 'blocked'
        continue
      }

      if (
        dependencySteps.every(
          (dependency) =>
            dependency?.status ===
            'completed',
        )
      ) {
        step.status = 'ready'
      }
    }
  }

  private updateBlockedSteps(
    steps: NexoraPlanStep[],
  ): void {
    for (const step of steps) {
      if (
        step.status !== 'ready'
      ) {
        continue
      }

      if (
        !step.dependsOn ||
        step.dependsOn.length === 0
      ) {
        continue
      }

      const dependencyFailed =
        step.dependsOn.some(
          (dependencyId) => {
            const dependency =
              steps.find(
                (candidate) =>
                  candidate.id ===
                  dependencyId,
              )

            return (
              dependency === undefined ||
              dependency.status ===
                'failed'
            )
          },
        )

      if (dependencyFailed) {
        step.status = 'failed'
        continue
      }

      const dependencyBlocked =
        step.dependsOn.some(
          (dependencyId) => {
            const dependency =
              steps.find(
                (candidate) =>
                  candidate.id ===
                  dependencyId,
              )

            return (
              dependency?.status ===
              'blocked'
            )
          },
        )

      if (dependencyBlocked) {
        step.status = 'blocked'
      }
    }
  }
}
