<script setup lang="ts">
import { ref, watch } from 'vue'
import GuiaRapido from './components/GuiaRapido.vue'
import IconeTraco from './components/IconeTraco.vue'

// O guia aparece na primeira visita; depois de fechado, só volta pelo botão "Como testar".
const CHAVE_GUIA = 'assina:guia-fechado'
const guiaAberto = ref(localStorage.getItem(CHAVE_GUIA) !== '1')
watch(guiaAberto, (aberto) => localStorage.setItem(CHAVE_GUIA, aberto ? '0' : '1'))
</script>

<template>
  <header class="topo">
    <RouterLink to="/" class="marca">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--primaria)" />
        <path
          d="M8 20c3-6 5-9 7-9s-1 9 1 9 3-5 5-5 1 4 3 4"
          fill="none"
          stroke="#fff"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      Assina
    </RouterLink>
    <div class="topo-direita">
      <button v-if="!guiaAberto" class="como-testar" @click="guiaAberto = true"><IconeTraco nome="ajuda" />Como testar</button>
      <a class="autor" href="https://joaopaulo.omniahub.com.br" target="_blank" rel="noopener">projeto de João Paulo ↗</a>
    </div>
  </header>
  <GuiaRapido v-if="guiaAberto" @fechar="guiaAberto = false" />
  <RouterView />
</template>

<style scoped>
.topo-direita {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.como-testar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--borda-forte);
  background: #fff;
  color: var(--texto);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
}
.como-testar:hover {
  border-color: var(--primaria);
  color: var(--primaria);
}
@media (max-width: 520px) {
  .autor {
    display: none;
  }
}
</style>
