
import { createNexora } from './core/createNexora'

async function testNexoraTaskContinuity() {
  const nexora = createNexora()

  console.log('TEST 1: Solicitar ejecución de test.echo')

  const firstResponse = await nexora.process({
    content: 'ejecuta test.echo',
  })

  console.log('Respuesta inicial:', firstResponse.message.content)

  const firstTaskId = nexora.getContext().taskId

  if (!firstTaskId) {
    throw new Error('No se creó una tarea.')
  }

  const firstTask = nexora.getTasks().find(
    (task) => task.id === firstTaskId,
  )

  if (firstTask?.status !== 'waiting_for_input') {
    throw new Error(
      `Se esperaba waiting_for_input; se obtuvo ${firstTask?.status}.`,
    )
  }

  console.log('Tarea pendiente confirmada:', firstTaskId)

  console.log('TEST 2: Enviar una frase que no es un identificador')

  await nexora.process({
    content: 'hola, ¿cómo estás?',
  })

  const taskAfterInvalidInput = nexora.getTasks().find(
    (task) => task.id === firstTaskId,
  )

  if (
    nexora.getContext().taskId !== firstTaskId ||
    taskAfterInvalidInput?.status !== 'waiting_for_input'
  ) {
    throw new Error(
      'La tarea original no se conservó después de una entrada inválida.',
    )
  }

  console.log('Entrada inválida rechazada; tarea conservada.')

  console.log('TEST 3: Proporcionar CLIENTE-123')

  const finalResponse = await nexora.process({
    content: 'CLIENTE-123',
  })

  const finalTask = nexora.getTasks().find(
    (task) => task.id === firstTaskId,
  )

  console.log('Respuesta final:', finalResponse.message.content)
  console.log('Estado final:', finalTask?.status)
  console.log(
  'Información guardada:',
  finalTask?.availableInformation,
)

const savedClientId =
  finalTask?.availableInformation.some(
    (item) =>
      item.key === 'clientId' &&
      item.value === 'CLIENTE-123',
  )

if (!savedClientId) {
  throw new Error(
    'El identificador ejecutado no quedó guardado en la tarea.',
  )
}
  console.log('Resultados:', finalResponse.executionResults)

  if (finalTask?.status !== 'completed') {
    throw new Error(
      `La tarea no se completó. Estado: ${finalTask?.status}.`,
    )
  }

  const successfulExecution =
    finalResponse.executionResults?.some(
      (result) =>
        result.toolId === 'test.echo' && result.success,
    )

  if (!successfulExecution) {
    throw new Error(
      'La herramienta test.echo no terminó correctamente.',
    )
  }

  console.log('TODAS LAS PRUEBAS PASARON.')
}

testNexoraTaskContinuity().catch((error: unknown) => {
  console.error('PRUEBA FALLIDA:', error)
})
