<script setup lang="ts">
// Ícones de traço que herdam a cor do texto. Ficam escondidos do leitor de tela:
// o nome do botão continua sendo o texto dele.
interface Desenho {
  p: string[]
  c?: [number, number, number][]
}

const DESENHOS = {
  ajuda: { c: [[12, 12, 9]], p: ['M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4M12 17h.01'] },
  concluir: { p: ['M5 12.5l4.5 4.5L19 7.5'] },
  voltar: { p: ['M15 6l-6 6 6 6'] },
  baixar: { p: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'] },
  link: { p: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'] },
  assinar: { p: ['M4 20h16', 'M14.5 4.5l3 3L8 17H5v-3z'] },
  local: { c: [[12, 11, 3]], p: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z'] },
  andamento: { p: ['M4 18l5-6 4 3 7-9', 'M15 6h5v5'] },
  arquivo: { p: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5M12 18v-6M9 15l3-3 3 3'] },
  exemplo: { p: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5M9 13h6M9 17h4'] },
  pessoa: { c: [[10, 8, 4]], p: ['M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6'] },
  enviar: { p: ['M21 3L10 14', 'M21 3l-7 18-4-7-7-4z'] },
  limpar: { p: ['M4 12a8 8 0 1 0 2.4-5.7', 'M4 4v4h4'] },
} satisfies Record<string, Desenho>

export type NomeIcone = keyof typeof DESENHOS

const props = defineProps<{ nome: NomeIcone }>()
const desenho: Desenho = DESENHOS[props.nome]
</script>

<template>
  <svg
    class="ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle v-for="(c, i) in desenho.c" :key="'c' + i" :cx="c[0]" :cy="c[1]" :r="c[2]" />
    <path v-for="(d, i) in desenho.p" :key="'p' + i" :d="d" />
  </svg>
</template>
