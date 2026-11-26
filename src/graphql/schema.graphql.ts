// O contrato da API. Num projeto real esse SDL é o mesmo do servidor;
// aqui ele roda no navegador (ver ./servidor.ts) pra demo subir sem back-end.
export const sdl = /* GraphQL */ `
  enum StatusDocumento {
    RASCUNHO
    AGUARDANDO
    CONCLUIDO
  }

  enum StatusSignatario {
    PENDENTE
    ASSINOU
  }

  type Signatario {
    id: ID!
    nome: String!
    email: String!
    ordem: Int!
    cor: String!
    status: StatusSignatario!
    assinadoEm: String
    assinatura: String
    podeAssinar: Boolean!
  }

  type Campo {
    id: ID!
    signatarioId: ID!
    pagina: Int!
    x: Float!
    y: Float!
    largura: Float!
    altura: Float!
  }

  type Evento {
    id: ID!
    tipo: String!
    descricao: String!
    em: String!
  }

  type Documento {
    id: ID!
    nome: String!
    paginas: Int!
    hash: String!
    criadoEm: String!
    status: StatusDocumento!
    signatarios: [Signatario!]!
    campos: [Campo!]!
    eventos: [Evento!]!
    progresso: Float!
  }

  input CampoInput {
    id: ID!
    signatarioId: ID!
    pagina: Int!
    x: Float!
    y: Float!
    largura: Float!
    altura: Float!
  }

  type Query {
    documentos: [Documento!]!
    documento(id: ID!): Documento
  }

  type Mutation {
    criarDocumento(nome: String!, paginas: Int!, hash: String!): Documento!
    adicionarSignatario(documentoId: ID!, nome: String!, email: String!): Documento!
    removerSignatario(documentoId: ID!, signatarioId: ID!): Documento!
    salvarCampos(documentoId: ID!, campos: [CampoInput!]!): Documento!
    enviarParaAssinatura(documentoId: ID!): Documento!
    assinar(documentoId: ID!, signatarioId: ID!, imagem: String!): Documento!
    excluirDocumento(id: ID!): Boolean!
  }
`
