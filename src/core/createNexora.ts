import { MockAIProvider } from '../ai/MockAIProvider'
import { NexoraCore } from './NexoraCore'
import { DefaultNexoraEngine } from './NexoraEngine'
import { AIBackedNexoraInterpreter } from './NexoraInterpreter'
import { DefaultNexoraPlanner } from './NexoraPlanner'
import { NexoraToolRegistry } from './NexoraToolRegistry'
import { NexoraPermissionManager } from './NexoraPermissionManager'
import { testEchoTool } from '../tools/TestEchoTool'

export function createNexora(): NexoraCore {
  const aiProvider = new MockAIProvider()

  const interpreter =
    new AIBackedNexoraInterpreter(aiProvider)

  const planner = new DefaultNexoraPlanner()

  const toolRegistry = new NexoraToolRegistry()

  toolRegistry.register(testEchoTool)

  const permissionManager =
    new NexoraPermissionManager()

  permissionManager.setPermission({
    toolId: 'test.echo',
    allowed: true,
    requiresConfirmation: false,
  })

  const engine = new DefaultNexoraEngine({
    interpreter,
    planner,
    aiProvider,
    getAvailableTools: () =>
      toolRegistry.getAll().map(
        (tool) => tool.definition,
      ),
  })

  return new NexoraCore({
    engine,
    toolRegistry,
    permissionManager,
  })
}
