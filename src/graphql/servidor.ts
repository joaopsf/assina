// "Servidor" GraphQL que roda no navegador: o mesmo schema e resolvers que iriam
// pro back-end, com os dados guardados no localStorage. Trocar por um servidor de
// verdade é só tirar o executeExchange do cliente e apontar pra URL da API.
import { buildSchema, GraphQLError } from 'graphql'
import { sdl } from './schema.graphql'
import * as regras from './regras'
import type { Campo, Documento } from './regras'

const CHAVE = 'assina:documentos:v1'

export interface Banco {
  ler(): Documento[]
  gravar(docs: Documento[]): void
}

export const bancoLocal: Banco = {
  ler: () => JSON.parse(localStorage.getItem(CHAVE) ?? '[]'),
  gravar: (docs) => localStorage.setItem(CHAVE, JSON.stringify(docs)),
}

export const schema = buildSchema(sdl)

/** Converte o erro de regra num erro GraphQL com código, como faria uma API real. */
function comRegra<T>(fn: () => T): T {
  try {
    return fn()
  } catch (e) {
    if (e instanceof regras.ErroDeRegra) throw new GraphQLError(e.message, { extensions: { code: 'REGRA_DE_NEGOCIO' } })
    throw e
  }
}

const comCampos = (doc: Documento) => ({
  ...doc,
  progresso: regras.progresso(doc),
  signatarios: doc.signatarios.map((s) => ({ ...s, podeAssinar: regras.proximoSignatario(doc)?.id === s.id })),
})

export function criarResolvers(banco: Banco) {
  const alterar = (id: string, fn: (doc: Documento) => void) =>
    comRegra(() => {
      const docs = banco.ler()
      const doc = docs.find((d) => d.id === id)
      if (!doc) throw new regras.ErroDeRegra('Documento não encontrado.')
      fn(doc)
      banco.gravar(docs)
      return comCampos(doc)
    })

  return {
    documentos: () =>
      banco
        .ler()
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .map(comCampos),
    documento: ({ id }: { id: string }) => {
      const doc = banco.ler().find((d) => d.id === id)
      return doc ? comCampos(doc) : null
    },
    criarDocumento: ({ nome, paginas, hash }: { nome: string; paginas: number; hash: string }) =>
      comRegra(() => {
        const doc = regras.criarDocumento(nome, paginas, hash)
        banco.gravar([...banco.ler(), doc])
        return comCampos(doc)
      }),
    adicionarSignatario: ({ documentoId, nome, email }: { documentoId: string; nome: string; email: string }) =>
      alterar(documentoId, (d) => regras.adicionarSignatario(d, nome, email)),
    removerSignatario: ({ documentoId, signatarioId }: { documentoId: string; signatarioId: string }) =>
      alterar(documentoId, (d) => regras.removerSignatario(d, signatarioId)),
    salvarCampos: ({ documentoId, campos }: { documentoId: string; campos: Campo[] }) =>
      alterar(documentoId, (d) => regras.salvarCampos(d, campos)),
    enviarParaAssinatura: ({ documentoId }: { documentoId: string }) => alterar(documentoId, (d) => regras.enviarParaAssinatura(d)),
    assinar: ({ documentoId, signatarioId, imagem }: { documentoId: string; signatarioId: string; imagem: string }) =>
      alterar(documentoId, (d) => regras.assinar(d, signatarioId, imagem)),
    excluirDocumento: ({ id }: { id: string }) => {
      banco.gravar(banco.ler().filter((d) => d.id !== id))
      return true
    },
  }
}
