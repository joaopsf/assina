<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery } from '@urql/vue'
import { CRIAR, EXCLUIR, LISTAR } from '../graphql/operacoes'
import { carregarPdf } from '../lib/pdf'
import { sha256 } from '../lib/hash'
import { apagarPdf, guardarPdf } from '../lib/arquivos'
import { STATUS, dataCurta, iniciais, mensagemDeErro } from '../lib/formatos'
import type { DocumentoGQL } from '../graphql/tipos'

const router = useRouter()
const lista = useQuery<{ documentos: DocumentoGQL[] }>({ query: LISTAR })
const criar = useMutation(CRIAR)
const excluir = useMutation(EXCLUIR)

const arrastando = ref(false)
const enviando = ref(false)
const erro = ref('')
const entrada = ref<HTMLInputElement>()

async function receber(bytes: ArrayBuffer, nome: string) {
  erro.value = ''
  enviando.value = true
  try {
    const [hash, pdf] = await Promise.all([sha256(bytes), carregarPdf(bytes)])
    const r = await criar.executeMutation({ nome, paginas: pdf.numPages, hash })
    if (r.error) throw new Error(mensagemDeErro(r.error))
    const id = r.data.criarDocumento.id as string
    await guardarPdf(id, bytes)
    router.push({ name: 'preparar', params: { id } })
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível abrir esse arquivo.'
  } finally {
    enviando.value = false
  }
}

async function escolher(arquivos: FileList | null | undefined) {
  const arquivo = arquivos?.[0]
  if (!arquivo) return
  if (arquivo.type !== 'application/pdf') {
    erro.value = 'Envie um arquivo PDF.'
    return
  }
  if (arquivo.size > 15 * 1024 * 1024) {
    erro.value = 'O PDF passa de 15 MB.'
    return
  }
  await receber(await arquivo.arrayBuffer(), arquivo.name.replace(/\.pdf$/i, ''))
}

async function usarExemplo() {
  enviando.value = true
  const { contratoDeExemplo } = await import('../lib/pdf-escrita')
  await receber(await contratoDeExemplo(), 'Contrato de prestação de serviços')
}

function soltar(e: DragEvent) {
  arrastando.value = false
  escolher(e.dataTransfer?.files)
}

async function apagar(doc: DocumentoGQL) {
  await excluir.executeMutation({ id: doc.id })
  await apagarPdf(doc.id)
  lista.executeQuery({ requestPolicy: 'network-only' })
}

const destino = (doc: DocumentoGQL) =>
  doc.status === 'RASCUNHO' ? { name: 'preparar', params: { id: doc.id } } : { name: 'acompanhar', params: { id: doc.id } }
</script>

<template>
  <main class="conteudo">
    <header class="cabecalho">
      <div>
        <h1>Documentos</h1>
        <p class="sub">Envie um PDF, marque onde cada pessoa assina e acompanhe até o fim.</p>
      </div>
    </header>

    <section
      class="envio"
      :class="{ arrastando, enviando }"
      @dragover.prevent="arrastando = true"
      @dragleave="arrastando = false"
      @drop.prevent="soltar"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M12 17v-6" />
        <path d="m9 14 3-3 3 3" />
      </svg>
      <p v-if="enviando"><strong>Lendo o PDF…</strong></p>
      <p v-else><strong>Arraste um PDF aqui</strong> ou</p>
      <div class="acoes" v-if="!enviando">
        <button class="botao" @click="entrada?.click()">Escolher arquivo</button>
        <button class="botao secundario" @click="usarExemplo">Usar contrato de exemplo</button>
      </div>
      <input ref="entrada" type="file" accept="application/pdf" hidden @change="escolher(($event.target as HTMLInputElement).files)" />
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <p class="nota">O arquivo não sai do seu navegador.</p>
    </section>

    <section v-if="lista.data.value?.documentos.length" class="lista">
      <h2>Recentes</h2>
      <ul>
        <li v-for="doc in lista.data.value.documentos" :key="doc.id">
          <RouterLink :to="destino(doc)" class="item">
            <div class="item-nome">
              <strong>{{ doc.nome }}</strong>
              <span>{{ doc.paginas }} {{ doc.paginas === 1 ? 'página' : 'páginas' }} · {{ dataCurta(doc.criadoEm) }}</span>
            </div>
            <div class="avatares" :aria-label="`${doc.signatarios.length} signatários`">
              <span
                v-for="s in doc.signatarios"
                :key="s.id"
                :style="{ background: s.cor }"
                :class="{ assinou: s.status === 'ASSINOU' }"
                :title="s.nome"
                >{{ iniciais(s.nome) }}</span
              >
            </div>
            <div class="progresso" v-if="doc.status !== 'RASCUNHO'">
              <span :style="{ width: `${doc.progresso * 100}%` }" />
            </div>
            <span class="selo" :class="STATUS[doc.status].classe">{{ STATUS[doc.status].rotulo }}</span>
          </RouterLink>
          <button class="apagar" :aria-label="`Excluir ${doc.nome}`" @click="apagar(doc)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
            </svg>
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.envio {
  margin-top: 2rem;
  border: 1.5px dashed var(--borda-forte);
  border-radius: 16px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  background: #fff;
  color: var(--texto-2);
  transition:
    border-color 0.2s,
    background 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.envio svg {
  color: var(--primaria);
}
.envio.arrastando {
  border-color: var(--primaria);
  background: var(--primaria-suave);
}
.envio.enviando {
  opacity: 0.7;
}
.envio strong {
  color: var(--texto);
}
.acoes {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
}
.nota {
  font-size: 0.8rem;
  color: var(--texto-3);
}
.erro {
  color: var(--perigo);
  font-size: 0.9rem;
}

.lista {
  margin-top: 2.5rem;
}
.lista h2 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--texto-3);
  margin-bottom: 0.75rem;
}
.lista ul {
  list-style: none;
  display: grid;
  gap: 0.5rem;
}
.lista li {
  position: relative;
}
.item {
  display: grid;
  grid-template-columns: 1fr auto 8rem 11rem;
  gap: 1.25rem;
  align-items: center;
  padding: 1rem 3.25rem 1rem 1.25rem;
  background: #fff;
  border: 1px solid var(--borda);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.item:hover {
  border-color: var(--borda-forte);
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06);
}
.item-nome {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.item-nome strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-nome span {
  font-size: 0.8rem;
  color: var(--texto-3);
}
.avatares {
  display: flex;
}
.avatares span {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
  margin-left: -0.4rem;
  opacity: 0.45;
}
.avatares span.assinou {
  opacity: 1;
}
.progresso {
  height: 6px;
  background: var(--fundo);
  border-radius: 999px;
  overflow: hidden;
}
.progresso span {
  display: block;
  height: 100%;
  background: var(--sucesso);
  border-radius: inherit;
  transition: width 0.4s;
}
.apagar {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: none;
  color: var(--texto-3);
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
}
.apagar:hover {
  color: var(--perigo);
  background: #fef3f2;
}
@media (max-width: 760px) {
  .item {
    grid-template-columns: 1fr auto;
  }
  .progresso {
    display: none;
  }
  .avatares {
    display: none;
  }
}
</style>
