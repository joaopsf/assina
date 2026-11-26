// As operações que as telas usam. Fragmentos evitam repetir os campos em cada uma.
import { gql } from '@urql/vue'

export const DOCUMENTO_COMPLETO = gql`
  fragment DocumentoCompleto on Documento {
    id
    nome
    paginas
    hash
    criadoEm
    status
    progresso
    signatarios {
      id
      nome
      email
      ordem
      cor
      status
      assinadoEm
      assinatura
      podeAssinar
    }
    campos {
      id
      signatarioId
      pagina
      x
      y
      largura
      altura
    }
    eventos {
      id
      tipo
      descricao
      em
    }
  }
`

export const LISTAR = gql`
  query Documentos {
    documentos {
      id
      nome
      criadoEm
      status
      progresso
      paginas
      signatarios {
        id
        nome
        cor
        status
      }
    }
  }
`

export const BUSCAR = gql`
  query Documento($id: ID!) {
    documento(id: $id) {
      ...DocumentoCompleto
    }
  }
  ${DOCUMENTO_COMPLETO}
`

export const CRIAR = gql`
  mutation Criar($nome: String!, $paginas: Int!, $hash: String!) {
    criarDocumento(nome: $nome, paginas: $paginas, hash: $hash) {
      id
    }
  }
`

export const ADICIONAR_SIGNATARIO = gql`
  mutation Adicionar($documentoId: ID!, $nome: String!, $email: String!) {
    adicionarSignatario(documentoId: $documentoId, nome: $nome, email: $email) {
      ...DocumentoCompleto
    }
  }
  ${DOCUMENTO_COMPLETO}
`

export const REMOVER_SIGNATARIO = gql`
  mutation Remover($documentoId: ID!, $signatarioId: ID!) {
    removerSignatario(documentoId: $documentoId, signatarioId: $signatarioId) {
      ...DocumentoCompleto
    }
  }
  ${DOCUMENTO_COMPLETO}
`

export const SALVAR_CAMPOS = gql`
  mutation Salvar($documentoId: ID!, $campos: [CampoInput!]!) {
    salvarCampos(documentoId: $documentoId, campos: $campos) {
      ...DocumentoCompleto
    }
  }
  ${DOCUMENTO_COMPLETO}
`

export const ENVIAR = gql`
  mutation Enviar($documentoId: ID!) {
    enviarParaAssinatura(documentoId: $documentoId) {
      ...DocumentoCompleto
    }
  }
  ${DOCUMENTO_COMPLETO}
`

export const ASSINAR = gql`
  mutation Assinar($documentoId: ID!, $signatarioId: ID!, $imagem: String!) {
    assinar(documentoId: $documentoId, signatarioId: $signatarioId, imagem: $imagem) {
      ...DocumentoCompleto
    }
  }
  ${DOCUMENTO_COMPLETO}
`

export const EXCLUIR = gql`
  mutation Excluir($id: ID!) {
    excluirDocumento(id: $id)
  }
`
