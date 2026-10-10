import type { NexoraPermission } from './types'

export class NexoraPermissionManager {
  private readonly permissions = new Map<string, NexoraPermission>()

  setPermission(permission: NexoraPermission): void {
    this.permissions.set(permission.toolId, permission)
  }

  removePermission(toolId: string): void {
    this.permissions.delete(toolId)
  }

  getPermission(toolId: string): NexoraPermission | undefined {
    return this.permissions.get(toolId)
  }

  canExecute(toolId: string): boolean {
    return this.permissions.get(toolId)?.allowed === true
  }

  requiresConfirmation(toolId: string): boolean {
    const permission = this.permissions.get(toolId)

    if (!permission) {
      return true
    }

    return permission.requiresConfirmation
  }

  clear(): void {
    this.permissions.clear()
  }
}