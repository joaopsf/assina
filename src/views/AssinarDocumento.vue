<script setup lang="ts">
import IconeTraco from '../components/IconeTraco.vue'
// O que a pessoa vê ao abrir o link do e-mail: o documento, os campos dela e o quadro de assinatura.
import { computed, ref, toRef } from 'vue'
import { useMutation, useQuery } from '@urql/vue'
import { ASSINAR, BUSCAR } from '../graphql/operacoes'
import type { DocumentoGQL } from '../graphql/tipos'
import { usePdf } from '../lib/usePdf'
import { mensagemDeErro } from '../lib/formatos'
import PaginaPdf from '../components/PaginaPdf.vue'
import CampoAssinatura from '../components/CampoAssinatura.vue'
import QuadroAssinatura from '../components/QuadroAssinatura.vue'

const props = defineProps<{ id: string; signatarioId: string }>()

const consulta = useQuery<{ documento: DocumentoGQL | null }>({ query: BUSCAR, variables: computed(() => ({ id: props.id })) })
const doc = computed(() => consulta.data.value?.documento ?? null)
const eu = computed(() => doc.value?.signatarios.find((s) => s.id === props.signatarioId) ?? null)
const vez = computed(() => doc.value?.signatarios.find((s) => s.podeAssinar) ?? null)
const meusCampos = computed(() => doc.value?.campos.filter((c) => c.signatarioId === props.signatarioId) ?? [])
const { pdf, erro: erroPdf } = usePdf(toRef(props, 'id'))

const assinar = useMutation(ASSINAR)
const quadroAberto = ref(false)
const erro = ref('')

async function confirmar(png: string) {
  quadroAberto.value = false
  erro.value = ''
  const r = await assinar.executeMutation({ documentoId: props.id, signatarioId: props.signatarioId, imagem: png })
  if (r.error) erro.value = mensagemDeErro(r.error)
}

function irParaCampo() {
  const primeiro = meusCampos.value[0]
  if (!primeiro) return
  document.querySelectorAll('.pagina')[primeiro.pagina - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <main v-if="doc && eu" class="assinar">
    <div class="faixa" :style="{ '--cor': eu.cor }">
      <div class="faixa-texto">
        <template v-if="eu.status === 'ASSINOU'">
          <strong>Pronto, {{ eu.nome.split(' ')[0] }}! Sua assinatura foi registrada.</strong>
          <span>{{ doc.status === 'CONCLUIDO' ? 'Todas as pessoas já assinaram.' : `Agora é a vez de ${vez?.nome}.` }}</span>
        </template>
        <template v-else-if="eu.podeAssinar">
          <strong>{{ eu.nome.split(' ')[0] }}, este documento espera a sua assinatura.</strong>
          <span
            >{{ meusCampos.length === 1 ? 'Há 1 campo marcado para você.' : `Há ${meusCampos.length} campos marcados para você.` }} A mesma
            assinatura vale para todos.</span
          >
        </template>
        <template v-else>
          <strong>Ainda não é a sua vez.</strong>
          <span>Este documento tem ordem de assinatura. Falta {{ vez?.nome }} assinar antes.</span>
        </template>
      </div>
      <button v-if="eu.podeAssinar" class="botao" @click="quadroAberto = true"><IconeTraco nome="assinar" />Assinar agora</button>
      <button v-else-if="eu.status !== 'ASSINOU'" class="botao secundario" @click="irParaCampo">
        <IconeTraco nome="local" />Ver onde vou assinar
      </button>
      <RouterLink v-else class="botao secundario" :to="{ name: 'acompanhar', params: { id } }"
        ><IconeTraco nome="andamento" />Ver andamento</RouterLink
      >
    </div>
    <p v-if="erro" class="erro conteudo" role="alert">{{ erro }}</p>

    <section class="paginas">
      <p v-if="erroPdf" class="erro">{{ erroPdf }}</p>
      <template v-else-if="pdf">
        <PaginaPdf v-for="n in doc.paginas" :key="n" :pdf="pdf" :numero="n">
          <CampoAssinatura
            v-for="c in doc.campos.filter((k) => k.pagina === n)"
            :key="c.id"
            :campo="c"
            :cor="doc.signatarios.find((s) => s.id === c.signatarioId)!.cor"
            :rotulo="doc.signatarios.find((s) => s.id === c.signatarioId)!.nome"
            :assinatura="doc.signatarios.find((s) => s.id === c.signatarioId)!.assinatura"
            :destaque="c.signatarioId === signatarioId && eu.podeAssinar"
            :modo="c.signatarioId === signatarioId ? 'assinar' : 'ver'"
            @assinar="eu.podeAssinar && (quadroAberto = true)"
          />
        </PaginaPdf>
      </template>
    </section>

    <QuadroAssinatura v-if="quadroAberto" :nome="eu.nome" :cor="eu.cor" @confirmar="confirmar" @cancelar="quadroAberto = false" />
  </main>
  <main v-else-if="!consulta.fetching.value" class="conteudo">
    <p>Link inválido. <RouterLink to="/">Voltar</RouterLink></p>
  </main>
</template>

<style scoped>
.faixa {
  position: sticky;
  top: var(--topo);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem clamp(1rem, 4vw, 4rem);
  background: #fff;
  border-bottom: 1px solid var(--borda);
  box-shadow: inset 4px 0 0 var(--cor);
}
.faixa-texto {
  display: flex;
  flex-direction: column;
}
.faixa-texto span {
  font-size: 0.88rem;
  color: var(--texto-2);
}
.paginas {
  padding: 2rem clamp(1rem, 4vw, 4rem) 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}
.paginas > :deep(.pagina) {
  width: min(100%, 52rem);
}
.erro {
  color: var(--perigo);
  margin-top: 1rem;
}
</style>
