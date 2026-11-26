import { describe, expect, it } from 'vitest'
import { encaixar, prender, relativoParaPdf } from './coordenadas'

describe('relativoParaPdf', () => {
  it('inverte o eixo Y: campo no topo da tela fica no topo do PDF', () => {
    // A4 em pontos: 595 x 842. Campo colado no topo, 10% de altura.
    const r = relativoParaPdf({ x: 0, y: 0, largura: 0.5, altura: 0.1 }, 595, 842)
    expect(r.y).toBeCloseTo(842 - 84.2)
    expect(r.altura).toBeCloseTo(84.2)
    expect(r.largura).toBeCloseTo(297.5)
  })

  it('campo colado embaixo começa no zero do PDF', () => {
    const r = relativoParaPdf({ x: 0.2, y: 0.9, largura: 0.3, altura: 0.1 }, 600, 800)
    expect(r.y).toBeCloseTo(0)
    expect(r.x).toBeCloseTo(120)
  })
})

describe('prender', () => {
  it('não deixa o campo sair da página', () => {
    expect(prender({ x: 0.9, y: -0.2, largura: 0.3, altura: 0.1 })).toEqual({ x: 0.7, y: 0, largura: 0.3, altura: 0.1 })
  })

  it('respeita o tamanho mínimo', () => {
    const r = prender({ x: 0.1, y: 0.1, largura: 0.001, altura: 0.001 })
    expect(r.largura).toBe(0.05)
    expect(r.altura).toBe(0.025)
  })
})

describe('encaixar', () => {
  it('mantém a proporção da imagem e centraliza na caixa', () => {
    // Imagem 200x50 (4:1) numa caixa 100x100: vira 100x25, centralizada na vertical.
    expect(encaixar(200, 50, { x: 0, y: 0, largura: 100, altura: 100 })).toEqual({ x: 0, y: 37.5, largura: 100, altura: 25 })
  })
})
