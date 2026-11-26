import { Client, cacheExchange } from '@urql/vue'
import { executeExchange } from '@urql/exchange-execute'
import { schema, criarResolvers, bancoLocal } from './servidor'

// cacheExchange é o cache de documento do urql: depois de uma mutation, as queries
// que tocam no mesmo __typename são refeitas sozinhas.
export const cliente = new Client({
  url: '/graphql', // não é usada: o executeExchange responde antes de sair pra rede
  exchanges: [cacheExchange, executeExchange({ schema, rootValue: criarResolvers(bancoLocal) })],
  requestPolicy: 'cache-and-network',
})
