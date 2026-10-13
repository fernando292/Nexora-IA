
import { createNexora } from './core/createNexora'

async function testNexoraTaskContinuity(): Promise<void> {
  const nexora = createNexora()

  console.log('=== PRUEBA DE CONTINUIDAD DE NEXORA ===')

  // Paso 1: solicitar la herramienta sin el dato obligatorio.
  const firstResponse = await nexora.process({
    content: 'ejecuta test.echo',
  })

  const firstTaskId = nexora.getContext().taskId

  if (!firstTaskId) {
    throw new Error(
      'FALLO: Nexora no creó ni asignó una tarea.',
    )
  }

  const firstTask = nexora
    .getTasks()
    .find((task) => task.id === firstTaskId)

  if (!firstTask) {
    throw new Error(
      'FALLO: no se encontró la tarea creada.',
    )
  }

  if (firstTask.status !== 'waiting_for_input') {
    throw new Error(
      `FALLO: se esperaba waiting_for_input, se obtuvo ${firstTask.status}.`,
    )
  }

  console.log('PASO 1: correcto')
  console.log('ID inicial:', firstTaskId)
  console.log('Estado inicial:', firstTask.status)
  console.log(
    'Información pendiente:',
    firstTask.missingInformation,
  )
  console.log('Respuesta:', firstResponse.message.content)

  // Paso 2: proporcionar el dato solicitado.
  const secondResponse = await nexora.process({
    content: 'CLIENTE-123',
  })

  const secondTaskId = nexora.getContext().taskId

  if (secondTaskId !== firstTaskId) {
    throw new Error(
      `FALLO: cambió el ID de tarea. Inicial: ${firstTaskId}; posterior: ${secondTaskId}.`,
    )
  }

  const finalTask = nexora
    .getTasks()
    .find((task) => task.id === firstTaskId)

  if (!finalTask) {
    throw new Error(
      'FALLO: no se encontró la tarea después de continuar.',
    )
  }

  if (finalTask.status !== 'completed') {
    throw new Error(
      `FALLO: se esperaba completed, se obtuvo ${finalTask.status}.`,
    )
  }

  const successfulExecution =
    secondResponse.executionResults?.some(
      (result) =>
        result.toolId === 'test.echo' &&
        result.success,
    ) ?? false

  if (!successfulExecution) {
    throw new Error(
      'FALLO: test.echo no registró una ejecución exitosa.',
    )
  }

  console.log('PASO 2: correcto')
  console.log('ID conservado:', secondTaskId)
  console.log('Estado final:', finalTask.status)
  console.log(
    'Ejecución:',
    secondResponse.executionResults,
  )
  console.log(
    'Respuesta final:',
    secondResponse.message.content,
  )
  console.log('RESULTADO: PRUEBA COMPLETADA')
}

testNexoraTaskContinuity().catch((error: unknown) => {
  console.error('RESULTADO: PRUEBA FALLIDA', error)
})
