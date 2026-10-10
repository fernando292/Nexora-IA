import type { NexoraEngineResult } from './NexoraEngine'
import type {
  NexoraTask,
  NexoraTaskMissingInformation,
} from './NexoraTask'

export interface NexoraTaskFactory {
  create(
    engineResult: NexoraEngineResult,
  ): NexoraTask
}

export class DefaultNexoraTaskFactory
  implements NexoraTaskFactory
{
  create(
    engineResult: NexoraEngineResult,
  ): NexoraTask {
    const {
      plan,
    } = engineResult

    const missingInformation =
      this.buildMissingInformation(
        plan.steps,
      )

    return {
      id: this.createTaskId(),
      objective: plan.objective,
      status:
        missingInformation.length > 0
          ? 'waiting_for_input'
          : 'pending',
      missingInformation,
      availableInformation: [],
      plan: [
        ...plan.steps,
      ],
    }
  }

  private buildMissingInformation(
    steps: NexoraEngineResult['plan']['steps'],
  ): NexoraTaskMissingInformation[] {
    const missingInformation: NexoraTaskMissingInformation[] =
      []

    for (const step of steps) {
      if (
        step.status !== 'blocked' ||
        !step.missingInputs
      ) {
        continue
      }

      for (const key of step.missingInputs) {
        const alreadyExists =
          missingInformation.some(
            (item) =>
              item.key === key,
          )

        if (alreadyExists) {
          continue
        }

        missingInformation.push({
          key,
          reason:
            step.description,
        })
      }
    }

    return missingInformation
  }

  private createTaskId(): string {
    return `task-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
  }
}