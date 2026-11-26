// O caminho inteiro pelo GraphQL: parse, validação do schema, resolvers e regras.
import { describe, expect, it } from 'vitest'
import { graphql } from 'graphql'
import { schema, criarResolvers, type Banco } from './servidor'
import type { Documento } from './regras'

function bancoEmMemoria(): Banco {
  let docs: Documento[] = []
  return { ler: () => structuredClone(docs), gravar: (d) => (docs = structuredClone(d)) }
}

function api() {
  const rootValue = criarResolvers(bancoEmMemoria())
  return (source: string, variableValues?: Record<string, unknown>) => graphql({ schema, source, rootValue, variableValues })
}

describe('API GraphQL', () => {
  it('cria, adiciona pessoa e lista com os campos calculados', async () => {
    const executar = api()
    const criado = await executar('mutation { criarDocumento(nome: "NDA", paginas: 1, hash: "abc") { id status } }')
    const id = (criado.data!.criarDocumento as { id: string }).id

    await executar('mutation($id: ID!) { adicionarSignatario(documentoId: $id, nome: "Ana", email: "ana@x.com") { id } }', { id })
    const lista = await executar('{ documentos { nome status progresso signatarios { nome podeAssinar } } }')

    expect(lista.errors).toBeUndefined()
    expect(lista.data!.documentos).toEqual([
      { nome: 'NDA', status: 'RASCUNHO', progresso: 0, signatarios: [{ nome: 'Ana', podeAssinar: false }] },
    ])
  })

  it('devolve erro de regra com código, sem derrubar a API', async () => {
    const executar = api()
    const r = await executar('mutation { criarDocumento(nome: "", paginas: 1, hash: "x") { id } }')
    expect(r.errors?.[0].message).toBe('Dê um nome ao documento.')
    expect(r.errors?.[0].extensions.code).toBe('REGRA_DE_NEGOCIO')
  })

  it('o schema recusa campo que não existe antes de chegar no resolver', async () => {
    const r = await api()('{ documentos { senha } }')
    expect(r.errors?.[0].message).toContain('Cannot query field "senha"')
  })

  it('podeAssinar aponta só pra pessoa da vez', async () => {
    const executar = api()
    const { data } = await executar('mutation { criarDocumento(nome: "C", paginas: 1, hash: "h") { id } }')
    const id = (data!.criarDocumento as { id: string }).id
    for (const [nome, email] of [
      ['Ana', 'a@x.com'],
      ['Bia', 'b@x.com'],
    ])
      await executar('mutation($id: ID!, $n: String!, $e: String!) { adicionarSignatario(documentoId: $id, nome: $n, email: $e) { id } }', {
        id,
        n: nome,
        e: email,
      })
    const doc = await executar('query($id: ID!) { documento(id: $id) { signatarios { id } } }', { id })
    const ids = (doc.data!.documento as { signatarios: { id: string }[] }).signatarios.map((s) => s.id)
    const campos = ids.map((signatarioId, i) => ({
      id: `c${i}`,
      signatarioId,
      pagina: 1,
      x: 0.1,
      y: 0.1 + i * 0.2,
      largura: 0.3,
      altura: 0.07,
    }))
    await executar('mutation($id: ID!, $c: [CampoInput!]!) { salvarCampos(documentoId: $id, campos: $c) { id } }', { id, c: campos })

    const enviado = await executar('mutation($id: ID!) { enviarParaAssinatura(documentoId: $id) { signatarios { nome podeAssinar } } }', {
      id,
    })
    expect((enviado.data!.enviarParaAssinatura as { signatarios: unknown[] }).signatarios).toEqual([
      { nome: 'Ana', podeAssinar: true },
      { nome: 'Bia', podeAssinar: false },
    ])
  })
})
