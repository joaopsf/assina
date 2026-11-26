<script setup lang="ts">
// Uma página do PDF desenhada num canvas, com uma camada por cima (slot) pros campos.
// Redesenha quando a largura do contêiner muda.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { desenharPagina, type PdfCarregado } from '../lib/pdf'

const props = defineProps<{ pdf: PdfCarregado; numero: number }>()
const emit = defineEmits<{ clique: [x: number, y: number] }>()

const caixa = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
const carregando = ref(true)
let ultimaLargura = 0
let observador: ResizeObserver | null = null

async function desenhar() {
  const largura = Math.floor(caixa.value?.clientWidth ?? 0)
  if (!canvas.value || !largura || largura === ultimaLargura) return
  ultimaLargura = largura
  await desenharPagina(props.pdf, props.numero, canvas.value, largura)
  carregando.value = false
}

function aoClicar(e: MouseEvent) {
  if (e.target !== e.currentTarget) return
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  emit('clique', (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
}

onMounted(() => {
  observador = new ResizeObserver(() => desenhar())
  if (caixa.value) observador.observe(caixa.value)
})
onBeforeUnmount(() => observador?.disconnect())
watch(
  () => props.pdf,
  () => {
    ultimaLargura = 0
    desenhar()
  },
)
</script>

<template>
  <div ref="caixa" class="pagina" :class="{ carregando }">
    <canvas ref="canvas" />
    <div class="camada" @click="aoClicar"><slot /></div>
    <span class="numero">{{ numero }}</span>
  </div>
</template>

<style scoped>
.pagina {
  position: relative;
  background: #fff;
  border-radius: 4px;
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.08),
    0 8px 24px rgba(16, 24, 40, 0.08);
  min-height: 200px;
}
.pagina.carregando {
  aspect-ratio: 595 / 842;
  background: linear-gradient(100deg, #f2f4f7 30%, #fafbfc 50%, #f2f4f7 70%) 0 0 / 200% 100%;
  animation: brilho 1.2s linear infinite;
}
@keyframes brilho {
  to {
    background-position: -200% 0;
  }
}
canvas {
  display: block;
  border-radius: 4px;
}
.camada {
  position: absolute;
  inset: 0;
}
.numero {
  position: absolute;
  right: -2rem;
  top: 0;
  font: 500 0.75rem var(--mono);
  color: var(--texto-3);
}
@media (max-width: 900px) {
  .numero {
    display: none;
  }
}
</style>
