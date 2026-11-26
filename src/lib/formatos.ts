import type { StatusDocumento } from '../graphql/regras'

export const STATUS: Record<StatusDocumento, { rotulo: string; classe: string }> = {
  RASCUNHO: { rotulo: 'Rascunho', classe: 'neutro' },
  AGUARDANDO: { rotulo: 'Aguardando assinaturas', classe: 'aviso' },
  CONCLUIDO: { rotulo: 'Concluído', classe: 'ok' },
}

export const dataCurta = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

/** Mensagem do GraphQL sem o prefixo técnico "[GraphQL]". */
export const mensagemDeErro = (e: { message: string } | undefined | null) => e?.message.replace(/^\[GraphQL\]\s*/, '') ?? ''
