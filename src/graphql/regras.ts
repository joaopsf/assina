// As regras de negócio, sem nada de GraphQL nem de navegador.
// Ficam separadas pra serem testadas direto (ver regras.test.ts).

export type StatusDocumento = 'RASCUNHO' | 'AGUARDANDO' | 'CONCLUIDO'

export interface Signatario {
  id: string
  nome: string
  email: string
  ordem: number
  cor: string
  status: 'PENDENTE' | 'ASSINOU'
  assinadoEm: string | null
  assinatura: string | null
}

export interface Campo {
  id: string
  signatarioId: string
  pagina: number
  /** Posição e tamanho relativos à página (0 a 1), pra não depender do zoom. */
  x: number
  y: number
  largura: number
  altura: number
}

export interface Evento {
  id: string
  tipo: string
  descricao: string
  em: string
}

export interface Documento {
  id: string
  nome: string
  paginas: number
  hash: string
  criadoEm: string
  status: StatusDocumento
  signatarios: Signatario[]
  campos: Campo[]
  eventos: Evento[]
}

export class ErroDeRegra extends Error {}

const CORES = ['#2F6BFF', '#E0803A', '#16A37B', '#B4479B', '#C9A227', '#5B6CF0']

let contador = 0
export const novoId = (prefixo: string) => `${prefixo}_${Date.now().toString(36)}${(contador++).toString(36)}`

function registrar(doc: Documento, tipo: string, descricao: string, agora: Date) {
  doc.eventos.push({ id: novoId('ev'), tipo, descricao, em: agora.toISOString() })
}

function exigirRascunho(doc: Documento) {
  if (doc.status !== 'RASCUNHO') throw new ErroDeRegra('O documento já foi enviado e não pode mais ser alterado.')
}

export function criarDocumento(nome: string, paginas: number, hash: string, agora = new Date()): Documento {
  if (!nome.trim()) throw new ErroDeRegra('Dê um nome ao documento.')
  if (paginas < 1) throw new ErroDeRegra('O PDF não tem páginas.')
  const doc: Documento = {
    id: novoId('doc'),
    nome: nome.trim(),
    paginas,
    hash,
    criadoEm: agora.toISOString(),
    status: 'RASCUNHO',
    signatarios: [],
    campos: [],
    eventos: [],
  }
  registrar(doc, 'CRIADO', `Documento "${doc.nome}" criado (SHA-256 ${hash.slice(0, 12)}…)`, agora)
  return doc
}

export function adicionarSignatario(doc: Documento, nome: string, email: string, agora = new Date()) {
  exigirRascunho(doc)
  const limpo = email.trim().toLowerCase()
  if (!nome.trim()) throw new ErroDeRegra('Informe o nome de quem vai assinar.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) throw new ErroDeRegra('E-mail inválido.')
  if (doc.signatarios.some((s) => s.email === limpo)) throw new ErroDeRegra('Essa pessoa já está na lista.')
  const s: Signatario = {
    id: novoId('sig'),
    nome: nome.trim(),
    email: limpo,
    ordem: doc.signatarios.length + 1,
    cor: CORES[doc.signatarios.length % CORES.length],
    status: 'PENDENTE',
    assinadoEm: null,
    assinatura: null,
  }
  doc.signatarios.push(s)
  registrar(doc, 'SIGNATARIO', `${s.nome} (${s.email}) adicionado como ${s.ordem}º a assinar`, agora)
  return doc
}

export function removerSignatario(doc: Documento, signatarioId: string, agora = new Date()) {
  exigirRascunho(doc)
  const s = doc.signatarios.find((x) => x.id === signatarioId)
  if (!s) throw new ErroDeRegra('Signatário não encontrado.')
  doc.signatarios = doc.signatarios.filter((x) => x.id !== signatarioId).map((x, i) => ({ ...x, ordem: i + 1 }))
  doc.campos = doc.campos.filter((c) => c.signatarioId !== signatarioId)
  registrar(doc, 'SIGNATARIO', `${s.nome} removido da lista`, agora)
  return doc
}

export function salvarCampos(doc: Documento, campos: Campo[]) {
  exigirRascunho(doc)
  const ids = new Set(doc.signatarios.map((s) => s.id))
  for (const c of campos) {
    if (!ids.has(c.signatarioId)) throw new ErroDeRegra('Campo ligado a alguém que não está na lista.')
    if (c.pagina < 1 || c.pagina > doc.paginas) throw new ErroDeRegra('Campo fora das páginas do documento.')
    if (c.x < 0 || c.y < 0 || c.x + c.largura > 1.0001 || c.y + c.altura > 1.0001) throw new ErroDeRegra('Campo fora da página.')
  }
  doc.campos = campos.map((c) => ({ ...c }))
  return doc
}

export function enviarParaAssinatura(doc: Documento, agora = new Date()) {
  exigirRascunho(doc)
  if (doc.signatarios.length === 0) throw new ErroDeRegra('Adicione pelo menos uma pessoa para assinar.')
  const semCampo = doc.signatarios.filter((s) => !doc.campos.some((c) => c.signatarioId === s.id))
  if (semCampo.length) throw new ErroDeRegra(`Falta posicionar o campo de: ${semCampo.map((s) => s.nome).join(', ')}.`)
  doc.status = 'AGUARDANDO'
  registrar(doc, 'ENVIADO', `Enviado para ${doc.signatarios.length} pessoa(s), na ordem definida`, agora)
  return doc
}

/** Quem pode assinar agora: o primeiro pendente na ordem. */
export function proximoSignatario(doc: Documento): Signatario | null {
  if (doc.status !== 'AGUARDANDO') return null
  return [...doc.signatarios].sort((a, b) => a.ordem - b.ordem).find((s) => s.status === 'PENDENTE') ?? null
}

export function assinar(doc: Documento, signatarioId: string, imagem: string, agora = new Date()) {
  if (doc.status === 'RASCUNHO') throw new ErroDeRegra('O documento ainda não foi enviado.')
  if (doc.status === 'CONCLUIDO') throw new ErroDeRegra('O documento já está concluído.')
  const s = doc.signatarios.find((x) => x.id === signatarioId)
  if (!s) throw new ErroDeRegra('Signatário não encontrado.')
  if (s.status === 'ASSINOU') throw new ErroDeRegra('Essa pessoa já assinou.')
  const vez = proximoSignatario(doc)
  if (vez?.id !== s.id) throw new ErroDeRegra(`Ainda não é a vez de ${s.nome}. Falta ${vez?.nome} assinar antes.`)
  if (!imagem.startsWith('data:image/png;base64,')) throw new ErroDeRegra('Assinatura inválida.')

  s.status = 'ASSINOU'
  s.assinadoEm = agora.toISOString()
  s.assinatura = imagem
  registrar(doc, 'ASSINADO', `${s.nome} assinou`, agora)

  if (doc.signatarios.every((x) => x.status === 'ASSINOU')) {
    doc.status = 'CONCLUIDO'
    registrar(doc, 'CONCLUIDO', 'Todas as assinaturas coletadas', agora)
  }
  return doc
}

export const progresso = (doc: Documento) =>
  doc.signatarios.length ? doc.signatarios.filter((s) => s.status === 'ASSINOU').length / doc.signatarios.length : 0
