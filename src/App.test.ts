import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

const montar = () => mount(App, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, RouterView: true } } })

describe('guia "Teste em 1 minuto"', () => {
  beforeEach(() => localStorage.clear())

  it('aparece na primeira visita, com os passos', () => {
    const app = montar()
    expect(app.text()).toContain('Teste em 1 minuto')
    expect(app.findAll('ol li')).toHaveLength(4)
    expect(app.find('.como-testar').exists()).toBe(false)
  })

  it('fecha, lembra no aparelho e volta pelo "Como testar"', async () => {
    const app = montar()
    await app.find('[aria-label="Fechar o guia"]').trigger('click')
    expect(app.text()).not.toContain('Teste em 1 minuto')

    const deNovo = montar()
    expect(deNovo.text()).not.toContain('Teste em 1 minuto')
    await deNovo.find('.como-testar').trigger('click')
    expect(deNovo.text()).toContain('Teste em 1 minuto')
  })
})
