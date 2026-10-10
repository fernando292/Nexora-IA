import type {
  NexoraTask,
  NexoraTaskInformation,
  NexoraTaskMissingInformation,
  NexoraTaskStatus,
} from './NexoraTask'

export interface NexoraTaskStore {
  create(task: NexoraTask): void
  get(taskId: string): NexoraTask | undefined
  getAll(): NexoraTask[]
  updateStatus(
    taskId: string,
    status: NexoraTaskStatus,
  ): boolean
  updateInformation(
    taskId: string,
    information: NexoraTaskInformation[],
  ): void
  updateMissingInformation(
    taskId: string,
    information: NexoraTaskMissingInformation[],
  ): void
  remove(taskId: string): void
  clear(): void
}

export class NexoraTaskManager
  implements NexoraTaskStore
{
  private readonly tasks =
    new Map<string, NexoraTask>()

  create(task: NexoraTask): void {
    this.tasks.set(
      task.id,
      this.cloneTask(task),
    )
  }

  get(
    taskId: string,
  ): NexoraTask | undefined {
    const task =
      this.tasks.get(taskId)

    if (!task) {
      return undefined
    }

    return this.cloneTask(task)
  }

  getAll(): NexoraTask[] {
    return Array.from(
      this.tasks.values(),
    ).map((task) =>
      this.cloneTask(task),
    )
  }

  updateStatus(
    taskId: string,
    status: NexoraTaskStatus,
  ): boolean {
    const task =
      this.tasks.get(taskId)

    if (!task) {
      return false
    }

    const allowedTransitions:
      Record<
        NexoraTaskStatus,
        NexoraTaskStatus[]
      > = {
      pending: [
        'in_progress',
        'cancelled',
      ],
      in_progress: [
        'waiting_for_input',
        'completed',
        'failed',
        'cancelled',
      ],
      waiting_for_input: [
        'in_progress',
        'cancelled',
      ],
      completed: [],
      failed: [
        'cancelled',
      ],
      cancelled: [],
    }

    const allowed =
      allowedTransitions[
        task.status
      ]

    if (
      !allowed.includes(status)
    ) {
      return false
    }

    task.status = status

    return true
  }

  updateInformation(
    taskId: string,
    information: NexoraTaskInformation[],
  ): void {
    const task =
      this.tasks.get(taskId)

    if (!task) {
      return
    }

    for (const newInformation of information) {
      const existingIndex =
        task.availableInformation.findIndex(
          (item) =>
            item.key ===
            newInformation.key,
        )

      if (existingIndex === -1) {
        task.availableInformation.push(
          newInformation,
        )
      } else {
        task.availableInformation[
          existingIndex
        ] = newInformation
      }

      task.missingInformation =
        task.missingInformation.filter(
          (item) =>
            item.key !==
            newInformation.key,
        )
    }
  }

  updateMissingInformation(
    taskId: string,
    information: NexoraTaskMissingInformation[],
  ): void {
    const task =
      this.tasks.get(taskId)

    if (!task) {
      return
    }

    const availableKeys =
      new Set(
        task.availableInformation.map(
          (item) => item.key,
        ),
      )

    task.missingInformation =
      information.filter(
        (item) =>
          !availableKeys.has(
            item.key,
          ),
      )
  }

  remove(taskId: string): void {
    this.tasks.delete(taskId)
  }

  clear(): void {
    this.tasks.clear()
  }

  private cloneTask(
    task: NexoraTask,
  ): NexoraTask {
    return {
      ...task,
      missingInformation: [
        ...task.missingInformation,
      ],
      availableInformation: [
        ...task.availableInformation,
      ],
      plan: task.plan
        ? [...task.plan]
        : undefined,
    }
  }
}