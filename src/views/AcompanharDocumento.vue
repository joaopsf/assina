<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useQuery } from '@urql/vue'
import { BUSCAR } from '../graphql/operacoes'
import type { DocumentoGQL } from '../graphql/tipos'
import { usePdf } from '../lib/usePdf'
import { STATUS, dataCurta, iniciais } from '../lib/formatos'

const props = defineProps<{ id: string }>()
const consulta = useQuery<{ documento: DocumentoGQL | null }>({
  query: BUSCAR,
  variables: computed(() => ({ id: props.id })),
  requestPolicy: 'network-only',
})
const doc = computed(() => consulta.data.value?.documento ?? null)
const { bytes } = usePdf(toRef(props, 'id'))
const baixando = ref(false)

async function baixar() {
  if (!doc.value || !bytes.value) return
  baixando.value = true
  try {
    const { gerarPdfAssinado } = await import('../lib/pdf-escrita')
    const pdf = await gerarPdfAssinado(bytes.value, doc.value)
    const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: 'application/pdf' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `${doc.value.nome} - assinado.pdf` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } finally {
    baixando.value = false
  }
}

const eventosRecentes = computed(() => [...(doc.value?.eventos ?? [])].reverse())
</script>

<template>
  <main v-if="doc" class="conteudo">
    <RouterLink to="/" class="voltar">← Documentos</RouterLink>
    <header class="cabecalho">
      <div>
        <h1>{{ doc.nome }}</h1>
        <p class="sub">
          <span class="selo" :class="STATUS[doc.status].classe">{{ STATUS[doc.status].rotulo }}</span>
          {{ Math.round(doc.progresso * 100) }}% assinado
        </p>
      </div>
      <button class="botao" :disabled="doc.status !== 'CONCLUIDO' || baixando" @click="baixar">
        {{ baixando ? 'Gerando…' : 'Baixar PDF assinado' }}
      </button>
    </header>

    <div class="barra" role="progressbar" :aria-valuenow="Math.round(doc.progresso * 100)" aria-valuemin="0" aria-valuemax="100">
      <span :style="{ width: `${doc.progresso * 100}%` }" />
    </div>

    <div class="grade">
      <section class="cartao">
        <h2>Assinaturas</h2>
        <ol class="pessoas">
          <li v-for="s in doc.signatarios" :key="s.id" :style="{ '--cor': s.cor }">
            <span class="avatar" :class="{ feito: s.status === 'ASSINOU' }">{{ s.status === 'ASSINOU' ? '✓' : iniciais(s.nome) }}</span>
            <div class="dados">
              <strong>{{ s.ordem }}. {{ s.nome }}</strong>
              <small v-if="s.status === 'ASSINOU'">assinou em {{ dataCurta(s.assinadoEm!) }}</small>
              <small v-else-if="s.podeAssinar">é a vez dessa pessoa</small>
              <small v-else>aguardando a vez</small>
            </div>
            <img v-if="s.assinatura" :src="s.assinatura" alt="" class="miniatura" />
            <RouterLink
              v-else-if="s.podeAssinar"
              class="botao pequeno"
              :to="{ name: 'assinar', params: { id: doc.id, signatarioId: s.id } }"
              >Abrir link</RouterLink
            >
          </li>
        </ol>
        <p class="nota">
          Num sistema real, cada pessoa recebe o link por e-mail quando chega a vez dela. Aqui, "Abrir link" simula esse e-mail.
        </p>
      </section>

      <section class="cartao">
        <h2>Histórico</h2>
        <ol class="eventos">
          <li v-for="e in eventosRecentes" :key="e.id" :class="e.tipo.toLowerCase()">
            <span>{{ e.descricao }}</span>
            <time :datetime="e.em">{{ dataCurta(e.em) }}</time>
          </li>
        </ol>
        <div class="hash">
          <small>Impressão digital do arquivo original (SHA-256)</small>
          <code>{{ doc.hash }}</code>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.voltar {
  font-size: 0.85rem;
  color: var(--texto-2);
  text-decoration: none;
}
.cabecalho {
  margin-top: 0.75rem;
}
.sub {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.barra {
  height: 8px;
  background: var(--borda);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 1.5rem;
}
.barra span {
  display: block;
  height: 100%;
  background: var(--sucesso);
  transition: width 0.5s;
}
.grade {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1.25rem;
  margin-top: 1.5rem;
}
.cartao {
  background: #fff;
  border: 1px solid var(--borda);
  border-radius: 14px;
  padding: 1.25rem;
}
.cartao h2 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--texto-3);
  margin-bottom: 1rem;
}
.pessoas {
  list-style: none;
  display: grid;
  gap: 0.75rem;
}
.pessoas li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: 2px solid var(--cor);
  color: var(--cor);
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex: none;
}
.avatar.feito {
  background: var(--cor);
  color: #fff;
}
.dados {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.dados small {
  color: var(--texto-3);
  font-size: 0.8rem;
}
.miniatura {
  height: 2.25rem;
  max-width: 7rem;
  object-fit: contain;
}
.nota {
  font-size: 0.8rem;
  color: var(--texto-3);
  margin-top: 1rem;
}
.eventos {
  list-style: none;
  display: grid;
  gap: 0.65rem;
  border-left: 2px solid var(--borda);
  padding-left: 1rem;
}
.eventos li {
  position: relative;
  display: flex;
  flex-direction: column;
  font-size: 0.88rem;
}
.eventos li::before {
  content: '';
  position: absolute;
  left: calc(-1rem - 6px);
  top: 0.4rem;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--borda-forte);
  border: 2px solid #fff;
}
.eventos li.assinado::before,
.eventos li.concluido::before {
  background: var(--sucesso);
}
.eventos time {
  font-size: 0.75rem;
  color: var(--texto-3);
}
.hash {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--borda);
  display: grid;
  gap: 0.3rem;
}
.hash small {
  color: var(--texto-3);
  font-size: 0.75rem;
}
.hash code {
  font: 0.72rem var(--mono);
  word-break: break-all;
  color: var(--texto-2);
}
@media (max-width: 860px) {
  .grade {
    grid-template-columns: 1fr;
  }
}
</style>
