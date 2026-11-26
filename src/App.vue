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
    <a class="autor" href="https://joaopaulo.omniahub.com.br" target="_blank" rel="noopener">projeto de João Paulo ↗</a>
  </header>
  <RouterView />
</template>
