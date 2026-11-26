import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history: o GitHub Pages não tem como redirecionar rotas pro index.html.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'lista', component: () => import('./views/ListaDocumentos.vue') },
    { path: '/documento/:id/preparar', name: 'preparar', component: () => import('./views/PrepararDocumento.vue'), props: true },
    { path: '/documento/:id/assinar/:signatarioId', name: 'assinar', component: () => import('./views/AssinarDocumento.vue'), props: true },
    { path: '/documento/:id', name: 'acompanhar', component: () => import('./views/AcompanharDocumento.vue'), props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
