<script setup lang="ts">
// Campo de assinatura em cima da página. No modo edição arrasta, redimensiona pelo canto
// e apaga; no modo assinatura vira botão (ou mostra a assinatura já feita).
// Pointer events cobrem mouse, toque e caneta com o mesmo código.
import { computed } from 'vue'
import type { Campo } from '../graphql/regras'

const props = defineProps<{
  campo: Campo
  cor: string
  rotulo: string
  modo: 'editar' | 'assinar' | 'ver'
  selecionado?: boolean
  assinatura?: string | null
  destaque?: boolean
}>()
const emit = defineEmits<{
  mover: [x: number, y: number, largura?: number, altura?: number]
  selecionar: []
  remover: []
  assinar: []
}>()

const estilo = computed(() => ({
  left: `${props.campo.x * 100}%`,
  top: `${props.campo.y * 100}%`,
  width: `${props.campo.largura * 100}%`,
  height: `${props.campo.altura * 100}%`,
  '--cor': props.cor,
}))

function arrastar(e: PointerEvent, redimensionar = false) {
  if (props.modo !== 'editar') return
  e.preventDefault()
  e.stopPropagation()
  emit('selecionar')
  const alvo = e.currentTarget as HTMLElement
  const pagina = (alvo.closest('.camada') as HTMLElement).getBoundingClientRect()
  const ponteiro = { x: e.clientX, y: e.clientY }
  const original = { ...props.campo }
  alvo.setPointerCapture(e.pointerId)

  const mover = (ev: PointerEvent) => {
    const dx = (ev.clientX - ponteiro.x) / pagina.width
    const dy = (ev.clientY - ponteiro.y) / pagina.height
    if (redimensionar) emit('mover', original.x, original.y, original.largura + dx, original.altura + dy)
    else emit('mover', original.x + dx, original.y + dy)
  }
  const soltar = () => {
    alvo.removeEventListener('pointermove', mover)
    alvo.removeEventListener('pointerup', soltar)
  }
  alvo.addEventListener('pointermove', mover)
  alvo.addEventListener('pointerup', soltar)
}

function teclado(e: KeyboardEvent) {
  if (props.modo === 'assinar' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    emit('assinar')
    return
  }
  if (props.modo !== 'editar') return
  const passo = e.shiftKey ? 0.05 : 0.01
  const { x, y } = props.campo
  const mapa: Record<string, [number, number]> = {
    ArrowLeft: [-passo, 0],
    ArrowRight: [passo, 0],
    ArrowUp: [0, -passo],
    ArrowDown: [0, passo],
  }
  if (mapa[e.key]) {
    e.preventDefault()
    emit('mover', x + mapa[e.key][0], y + mapa[e.key][1])
  }
  if (e.key === 'Delete' || e.key === 'Backspace') emit('remover')
}
</script>

<template>
  <div
    class="campo"
    :class="[modo, { selecionado, destaque, feito: !!assinatura }]"
    :style="estilo"
    :tabindex="modo === 'ver' ? -1 : 0"
    :role="modo === 'assinar' ? 'button' : undefined"
    :aria-label="modo === 'assinar' ? `Assinar como ${rotulo}` : `Campo de ${rotulo}`"
    @pointerdown="arrastar($event)"
    @click.stop="modo === 'assinar' && !assinatura ? emit('assinar') : null"
    @keydown="teclado"
  >
    <img v-if="assinatura" :src="assinatura" alt="" />
    <span v-else class="rotulo">{{ modo === 'assinar' ? 'Clique para assinar' : rotulo }}</span>
    <template v-if="modo === 'editar'">
      <button class="apagar" aria-label="Remover campo" @pointerdown.stop @click.stop="emit('remover')">×</button>
      <span class="alca" @pointerdown="arrastar($event, true)" />
    </template>
  </div>
</template>

<style scoped>
.campo {
  position: absolute;
  border: 1.5px dashed var(--cor);
  background: color-mix(in srgb, var(--cor) 9%, transparent);
  border-radius: 4px;
  display: grid;
  place-items: center;
  user-select: none;
  touch-action: none;
}
.campo.editar {
  cursor: grab;
}
.campo.editar:active {
  cursor: grabbing;
}
.campo.selecionado {
  border-style: solid;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cor) 22%, transparent);
}
.campo.assinar {
  cursor: pointer;
  border-style: solid;
  animation: chamar 1.8s ease-in-out infinite;
}
.campo.assinar:not(.destaque) {
  animation: none;
  opacity: 0.45;
  cursor: default;
}
.campo.feito {
  border-color: transparent;
  background: transparent;
  animation: none;
  opacity: 1;
}
.campo:focus-visible {
  outline: 2px solid var(--cor);
  outline-offset: 2px;
}
@keyframes chamar {
  50% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--cor) 18%, transparent);
  }
}
.rotulo {
  font: 600 clamp(0.55rem, 1.1vw, 0.75rem) var(--sans);
  color: var(--cor);
  text-align: center;
  padding: 0 0.3rem;
  pointer-events: none;
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.apagar {
  position: absolute;
  top: -0.65rem;
  right: -0.65rem;
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 999px;
  border: 0;
  background: var(--cor);
  color: #fff;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  display: none;
}
.selecionado .apagar,
.campo:hover .apagar {
  display: block;
}
.alca {
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid var(--cor);
  border-radius: 2px;
  cursor: nwse-resize;
}
</style>
