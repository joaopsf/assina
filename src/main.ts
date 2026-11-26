import { createApp } from 'vue'
import { createPinia } from 'pinia'
import urql from '@urql/vue'
import App from './App.vue'
import { router } from './router'
import { cliente } from './graphql/cliente'
import './estilo.css'

createApp(App).use(createPinia()).use(router).use(urql, cliente).mount('#app')
