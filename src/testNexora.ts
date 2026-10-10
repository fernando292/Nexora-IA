import { createNexora } from './core/createNexora'

async function testNexoraExecutionResponse() {
  const nexora = createNexora()

  const result = await nexora.process({
    content: 'ejecuta test.echo',
  })

  console.log(
    'NEXORA CONTEXTUAL RESPONSE:',
    result,
  )
}

testNexoraExecutionResponse()