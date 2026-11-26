// Estado da TELA de preparação (o que ainda não foi salvo e o que está selecionado).
// Dado do servidor fica no GraphQL; aqui só o que é da interface.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Campo } from '../graphql/regras'
import { novoId } from '../graphql/regras'
import { prender } from '../lib/coordenadas'

export const useEditor = defineStore('editor', () => {
  const campos = ref<Campo[]>([])
  const signatarioAtivo = ref<string | null>(null)
  const campoSelecionado = ref<string | null>(null)
  const alterado = ref(false)

  function carregar(iniciais: Campo[], primeiroSignatario: string | null) {
    campos.value = iniciais.map((c) => ({ ...c }))
    signatarioAtivo.value = primeiroSignatario
    campoSelecionado.value = null
    alterado.value = false
  }

  function adicionar(pagina: number, x: number, y: number) {
    if (!signatarioAtivo.value) return null
    const r = prender({ x: x - 0.14, y: y - 0.035, largura: 0.28, altura: 0.07 })
    const campo: Campo = { id: novoId('cmp'), signatarioId: signatarioAtivo.value, pagina, ...r }
    campos.value.push(campo)
    campoSelecionado.value = campo.id
    alterado.value = true
    return campo
  }

  function mover(id: string, x: number, y: number, largura?: number, altura?: number) {
    const c = campos.value.find((k) => k.id === id)
    if (!c) return
    Object.assign(c, prender({ x, y, largura: largura ?? c.largura, altura: altura ?? c.altura }))
    alterado.value = true
  }

  function remover(id: string) {
    campos.value = campos.value.filter((c) => c.id !== id)
    if (campoSelecionado.value === id) campoSelecionado.value = null
    alterado.value = true
  }

  function removerDoSignatario(signatarioId: string) {
    campos.value = campos.value.filter((c) => c.signatarioId !== signatarioId)
  }

  const porPagina = computed(() => (pagina: number) => campos.value.filter((c) => c.pagina === pagina))
  const contagem = computed(() => (signatarioId: string) => campos.value.filter((c) => c.signatarioId === signatarioId).length)

  return {
    campos,
    signatarioAtivo,
    campoSelecionado,
    alterado,
    carregar,
    adicionar,
    mover,
    remover,
    removerDoSignatario,
    porPagina,
    contagem,
  }
})
