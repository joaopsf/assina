<script setup lang="ts">
// Quadro pra desenhar a assinatura. Traço suave com curvas entre os pontos médios,
// espessura que varia com a velocidade (como caneta), e PNG recortado no fim.
import { onMounted, ref } from 'vue'

defineProps<{ nome: string; cor: string }>()
const emit = defineEmits<{ confirmar: [png: string]; cancelar: [] }>()

const canvas = ref<HTMLCanvasElement>()
const vazio = ref(true)
let ctx: CanvasRenderingContext2D
let pontos: { x: number; y: number; t: number }[] = []
let espessura = 2.6

onMounted(() => {
  const c = canvas.value!
  const dpr = window.devicePixelRatio || 1
  c.width = c.clientWidth * dpr
  c.height = c.clientHeight * dpr
  ctx = c.getContext('2d')!
  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#1b2333'
})

const ponto = (e: PointerEvent) => {
  const r = canvas.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }
}

function comecar(e: PointerEvent) {
  canvas.value!.setPointerCapture(e.pointerId)
  pontos = [ponto(e)]
  vazio.value = false
}

function tracar(e: PointerEvent) {
  if (!pontos.length) return
  const p = ponto(e)
  const ultimo = pontos[pontos.length - 1]
  const dist = Math.hypot(p.x - ultimo.x, p.y - ultimo.y)
  if (dist < 1.5) return
  const velocidade = dist / Math.max(p.t - ultimo.t, 1)
  espessura = espessura * 0.7 + Math.max(1.2, 3.4 - velocidade * 1.6) * 0.3
  pontos.push(p)
  if (pontos.length < 3) return
  const [a, b, c] = pontos.slice(-3)
  ctx.lineWidth = espessura
  ctx.beginPath()
  ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2)
  ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2)
  ctx.stroke()
}

function parar() {
  if (pontos.length === 1) {
    const [p] = pontos
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2)
    ctx.fillStyle = '#1b2333'
    ctx.fill()
  }
  pontos = []
}

function limpar() {
  const c = canvas.value!
  ctx.clearRect(0, 0, c.width, c.height)
  vazio.value = true
}

/** Recorta o espaço vazio em volta do traço pra assinatura encaixar bem no campo. */
function recortar(): string {
  const c = canvas.value!
  const { data, width, height } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
  let x0 = width,
    y0 = height,
    x1 = 0,
    y1 = 0
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  const margem = 8
  const saida = document.createElement('canvas')
  saida.width = x1 - x0 + margem * 2
  saida.height = y1 - y0 + margem * 2
  saida.getContext('2d')!.drawImage(c, x0 - margem, y0 - margem, saida.width, saida.height, 0, 0, saida.width, saida.height)
  return saida.toDataURL('image/png')
}
</script>

<template>
  <div class="fundo" @click.self="emit('cancelar')" @keydown.esc="emit('cancelar')">
    <div class="janela" role="dialog" aria-modal="true" :aria-label="`Assinatura de ${nome}`" :style="{ '--cor': cor }">
      <header>
        <div>
          <h2>Sua assinatura</h2>
          <p>Desenhe com o mouse, o dedo ou a caneta.</p>
        </div>
        <button class="botao-texto" @click="emit('cancelar')">Cancelar</button>
      </header>
      <div class="area">
        <canvas ref="canvas" @pointerdown="comecar" @pointermove="tracar" @pointerup="parar" @pointercancel="parar" />
        <span class="linha" />
        <span class="nome">{{ nome }}</span>
        <span v-if="vazio" class="dica">assine aqui</span>
      </div>
      <footer>
        <button class="botao secundario" :disabled="vazio" @click="limpar">Limpar</button>
        <button class="botao" :disabled="vazio" @click="emit('confirmar', recortar())">Confirmar assinatura</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.fundo {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(16, 24, 40, 0.45);
  display: grid;
  place-items: center;
  padding: 1rem;
  backdrop-filter: blur(2px);
}
.janela {
  width: min(40rem, 100%);
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 48px rgba(16, 24, 40, 0.2);
  overflow: hidden;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 1.25rem 1.5rem 0.5rem;
}
h2 {
  font-size: 1.15rem;
}
header p {
  color: var(--texto-2);
  font-size: 0.9rem;
  margin-top: 0.2rem;
}
.area {
  position: relative;
  margin: 0.75rem 1.5rem;
  height: 13rem;
  border: 1px solid var(--borda);
  border-radius: 10px;
  background: #fcfcfd;
}
canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
}
.linha {
  position: absolute;
  left: 2rem;
  right: 2rem;
  bottom: 3rem;
  border-bottom: 1.5px solid var(--borda);
  pointer-events: none;
}
.nome {
  position: absolute;
  left: 2rem;
  bottom: 1.2rem;
  font-size: 0.8rem;
  color: var(--texto-3);
  pointer-events: none;
}
.dica {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--texto-3);
  font-size: 0.95rem;
  pointer-events: none;
}
footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0 1.5rem 1.25rem;
}
</style>
