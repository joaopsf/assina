<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery } from '@urql/vue'
import { ADICIONAR_SIGNATARIO, BUSCAR, ENVIAR, REMOVER_SIGNATARIO, SALVAR_CAMPOS } from '../graphql/operacoes'
import type { DocumentoGQL } from '../graphql/tipos'
import { useEditor } from '../stores/editor'
import { usePdf } from '../lib/usePdf'
import { iniciais, mensagemDeErro } from '../lib/formatos'
import PaginaPdf from '../components/PaginaPdf.vue'
import CampoAssinatura from '../components/CampoAssinatura.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const editor = useEditor()

const consulta = useQuery<{ documento: DocumentoGQL | null }>({ query: BUSCAR, variables: computed(() => ({ id: props.id })) })
const doc = computed(() => consulta.data.value?.documento ?? null)
const { pdf, erro: erroPdf } = usePdf(toRef(props, 'id'))

const adicionar = useMutation(ADICIONAR_SIGNATARIO)
const remover = useMutation(REMOVER_SIGNATARIO)
const salvar = useMutation(SALVAR_CAMPOS)
const enviar = useMutation(ENVIAR)

const nome = ref('')
const email = ref('')
const erro = ref('')
const salvando = ref(false)

// Documento já enviado não volta pra edição.
watch(doc, (d) => {
  if (d && d.status !== 'RASCUNHO') router.replace({ name: 'acompanhar', params: { id: d.id } })
})

// Carrega os campos salvos no editor uma vez por documento.
watch(
  () => doc.value?.id,
  (id) => {
    if (id && doc.value) editor.carregar(doc.value.campos, doc.value.signatarios[0]?.id ?? null)
  },
  { immediate: true },
)

const corDe = (signatarioId: string) => doc.value?.signatarios.find((s) => s.id === signatarioId)?.cor ?? '#888'
const nomeDe = (signatarioId: string) => doc.value?.signatarios.find((s) => s.id === signatarioId)?.nome ?? ''

async function adicionarPessoa() {
  erro.value = ''
  const r = await adicionar.executeMutation({ documentoId: props.id, nome: nome.value, email: email.value })
  if (r.error) return (erro.value = mensagemDeErro(r.error))
  const novo = r.data.adicionarSignatario.signatarios.at(-1)
  editor.signatarioAtivo = novo.id
  nome.value = ''
  email.value = ''
}

async function removerPessoa(signatarioId: string) {
  await gravarCampos()
  const r = await remover.executeMutation({ documentoId: props.id, signatarioId })
  if (r.error) return (erro.value = mensagemDeErro(r.error))
  editor.removerDoSignatario(signatarioId)
  if (editor.signatarioAtivo === signatarioId) editor.signatarioAtivo = r.data.removerSignatario.signatarios[0]?.id ?? null
}

// Salva sozinho, meio segundo depois da última mudança.
let espera: ReturnType<typeof setTimeout> | undefined
watch(
  () => editor.campos.map((c) => `${c.id}${c.x}${c.y}${c.largura}${c.altura}`).join(),
  () => {
    if (!editor.alterado) return
    clearTimeout(espera)
    espera = setTimeout(gravarCampos, 500)
  },
)

async function gravarCampos() {
  clearTimeout(espera)
  if (!editor.alterado) return true
  salvando.value = true
  const r = await salvar.executeMutation({ documentoId: props.id, campos: editor.campos })
  salvando.value = false
  if (r.error) {
    erro.value = mensagemDeErro(r.error)
    return false
  }
  editor.alterado = false
  return true
}

async function enviarDocumento() {
  erro.value = ''
  if (!(await gravarCampos())) return
  const r = await enviar.executeMutation({ documentoId: props.id })
  if (r.error) return (erro.value = mensagemDeErro(r.error))
  router.push({ name: 'acompanhar', params: { id: props.id } })
}

function clicarNaPagina(pagina: number, x: number, y: number) {
  if (!editor.signatarioAtivo) {
    erro.value = 'Adicione quem vai assinar antes de marcar os campos.'
    return
  }
  editor.adicionar(pagina, x, y)
}
</script>

<template>
  <main class="editor" v-if="doc">
    <section class="paginas" @click.self="editor.campoSelecionado = null">
      <p v-if="erroPdf" class="erro">{{ erroPdf }}</p>
      <template v-else-if="pdf">
        <PaginaPdf v-for="n in doc.paginas" :key="n" :pdf="pdf" :numero="n" @clique="(x, y) => clicarNaPagina(n, x, y)">
          <CampoAssinatura
            v-for="c in editor.porPagina(n)"
            :key="c.id"
            :campo="c"
            :cor="corDe(c.signatarioId)"
            :rotulo="nomeDe(c.signatarioId)"
            :selecionado="editor.campoSelecionado === c.id"
            modo="editar"
            @selecionar="editor.campoSelecionado = c.id"
            @mover="(x, y, l, a) => editor.mover(c.id, x, y, l, a)"
            @remover="editor.remover(c.id)"
          />
        </PaginaPdf>
      </template>
    </section>

    <aside class="painel">
      <RouterLink to="/" class="voltar">← Documentos</RouterLink>
      <h1>{{ doc.nome }}</h1>
      <p class="sub">
        {{ doc.paginas }} {{ doc.paginas === 1 ? 'página' : 'páginas' }} · rascunho
        <span class="salvo">{{ salvando ? 'salvando…' : editor.alterado ? '' : '· salvo' }}</span>
      </p>

      <h2>Quem assina, nesta ordem</h2>
      <ol class="pessoas" v-if="doc.signatarios.length">
        <li v-for="s in doc.signatarios" :key="s.id" :class="{ ativo: editor.signatarioAtivo === s.id }" :style="{ '--cor': s.cor }">
          <button class="pessoa" @click="editor.signatarioAtivo = s.id" :aria-pressed="editor.signatarioAtivo === s.id">
            <span class="avatar">{{ iniciais(s.nome) }}</span>
            <span class="dados"
              ><strong>{{ s.nome }}</strong
              ><small>{{ s.email }}</small></span
            >
            <span class="contagem" :class="{ falta: !editor.contagem(s.id) }">{{ editor.contagem(s.id) || 'sem campo' }}</span>
          </button>
          <button class="tirar" :aria-label="`Remover ${s.nome}`" @click="removerPessoa(s.id)">×</button>
        </li>
      </ol>

      <form class="nova" @submit.prevent="adicionarPessoa">
        <input v-model="nome" placeholder="Nome" aria-label="Nome de quem assina" autocomplete="off" />
        <input v-model="email" placeholder="E-mail" type="email" aria-label="E-mail de quem assina" autocomplete="off" />
        <button class="botao secundario" :disabled="!nome || !email">Adicionar pessoa</button>
      </form>

      <div class="dica" v-if="doc.signatarios.length">
        Escolha a pessoa acima e <strong>clique na página</strong> onde ela deve assinar. Arraste para mover, puxe o canto para mudar o
        tamanho. Com o campo selecionado, as setas do teclado também movem.
      </div>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <button class="botao enviar" :disabled="!doc.signatarios.length" @click="enviarDocumento">Enviar para assinatura</button>
    </aside>
  </main>
  <main v-else-if="!consulta.fetching.value" class="conteudo">
    <p>Documento não encontrado. <RouterLink to="/">Voltar</RouterLink></p>
  </main>
</template>

<style scoped>
.editor {
  display: grid;
  grid-template-columns: 1fr 22rem;
  min-height: calc(100vh - var(--topo));
}
.paginas {
  padding: 2rem clamp(1rem, 4vw, 4rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  background: var(--fundo);
}
.paginas > :deep(.pagina) {
  width: min(100%, 52rem);
}
.painel {
  position: sticky;
  top: var(--topo);
  align-self: start;
  height: calc(100vh - var(--topo));
  overflow: auto;
  background: #fff;
  border-left: 1px solid var(--borda);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.voltar {
  font-size: 0.85rem;
  color: var(--texto-2);
  text-decoration: none;
}
.painel h1 {
  font-size: 1.2rem;
  line-height: 1.3;
}
.painel h2 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--texto-3);
  margin-top: 0.5rem;
}
.salvo {
  color: var(--sucesso);
}
.pessoas {
  list-style: none;
  display: grid;
  gap: 0.4rem;
}
.pessoas li {
  position: relative;
}
.pessoa {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 2rem 0.6rem 0.6rem;
  border: 1px solid var(--borda);
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.ativo .pessoa {
  border-color: var(--cor);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cor) 15%, transparent);
}
.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: var(--cor);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex: none;
}
.dados {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.dados strong {
  font-size: 0.9rem;
}
.dados small {
  font-size: 0.75rem;
  color: var(--texto-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contagem {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--cor);
  white-space: nowrap;
}
.contagem.falta {
  color: var(--perigo);
}
.tirar {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: none;
  color: var(--texto-3);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
}
.tirar:hover {
  color: var(--perigo);
  background: #fef3f2;
}
.nova {
  display: grid;
  gap: 0.45rem;
}
.dica {
  font-size: 0.82rem;
  color: var(--texto-2);
  background: var(--primaria-suave);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  line-height: 1.5;
}
.erro {
  color: var(--perigo);
  font-size: 0.85rem;
}
.enviar {
  margin-top: auto;
}
@media (max-width: 900px) {
  .editor {
    grid-template-columns: 1fr;
  }
  .painel {
    position: static;
    height: auto;
    border-left: 0;
    border-top: 1px solid var(--borda);
    order: -1;
  }
}
</style>
