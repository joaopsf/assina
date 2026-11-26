import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditor } from './editor'

describe('editor de campos', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('não cria campo sem pessoa escolhida', () => {
    const editor = useEditor()
    editor.carregar([], null)
    expect(editor.adicionar(1, 0.5, 0.5)).toBeNull()
  })

  it('cria o campo centrado no clique e já selecionado', () => {
    const editor = useEditor()
    editor.carregar([], 'sig_1')
    const campo = editor.adicionar(2, 0.5, 0.5)!
    expect(campo.x + campo.largura / 2).toBeCloseTo(0.5)
    expect(campo.pagina).toBe(2)
    expect(editor.campoSelecionado).toBe(campo.id)
    expect(editor.alterado).toBe(true)
  })

  it('clique na borda mantém o campo inteiro dentro da página', () => {
    const editor = useEditor()
    editor.carregar([], 'sig_1')
    const campo = editor.adicionar(1, 0.99, 0.99)!
    expect(campo.x + campo.largura).toBeLessThanOrEqual(1)
    expect(campo.y + campo.altura).toBeLessThanOrEqual(1)
  })

  it('conta e filtra campos por pessoa e por página', () => {
    const editor = useEditor()
    editor.carregar([], 'sig_1')
    editor.adicionar(1, 0.3, 0.3)
    editor.adicionar(2, 0.3, 0.3)
    editor.signatarioAtivo = 'sig_2'
    editor.adicionar(2, 0.6, 0.6)
    expect(editor.contagem('sig_1')).toBe(2)
    expect(editor.porPagina(2)).toHaveLength(2)
  })

  it('carregar não marca como alterado e copia os campos (não compartilha referência)', () => {
    const editor = useEditor()
    const iniciais = [{ id: 'c', signatarioId: 's', pagina: 1, x: 0.1, y: 0.1, largura: 0.2, altura: 0.1 }]
    editor.carregar(iniciais, 's')
    editor.mover('c', 0.5, 0.5)
    expect(iniciais[0].x).toBe(0.1)
    expect(editor.alterado).toBe(true)
  })
})
