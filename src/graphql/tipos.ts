// Formato que chega nas telas (o que o schema devolve).
import type { Campo, Evento, StatusDocumento } from './regras'

export interface SignatarioGQL {
  id: string
  nome: string
  email: string
  ordem: number
  cor: string
  status: 'PENDENTE' | 'ASSINOU'
  assinadoEm: string | null
  assinatura: string | null
  podeAssinar: boolean
}

export interface DocumentoGQL {
  id: string
  nome: string
  paginas: number
  hash: string
  criadoEm: string
  status: StatusDocumento
  progresso: number
  signatarios: SignatarioGQL[]
  campos: Campo[]
  eventos: Evento[]
}
