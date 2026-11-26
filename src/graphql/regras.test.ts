import { describe, expect, it } from 'vitest'
import * as r from './regras'

const PNG = 'data:image/png;base64,iVBORw0KGgo='

function documentoComDuasPessoas() {
  const doc = r.criarDocumento('Contrato', 2, 'a'.repeat(64))
  r.adicionarSignatario(doc, 'Ana Lima', 'ana@exemplo.com')
  r.adicionarSignatario(doc, 'Bruno Reis', 'bruno@exemplo.com')
  const [ana, bruno] = doc.signatarios
  r.salvarCampos(doc, [
    { id: 'c1', signatarioId: ana.id, pagina: 2, x: 0.1, y: 0.2, largura: 0.3, altura: 0.07 },
    { id: 'c2', signatarioId: bruno.id, pagina: 2, x: 0.1, y: 0.4, largura: 0.3, altura: 0.07 },
  ])
  return { doc, ana, bruno }
}

describe('criar documento', () => {
  it('nasce como rascunho e registra o hash no histórico', () => {
    const doc = r.criarDocumento('  Proposta  ', 3, 'f'.repeat(64))
    expect(doc.nome).toBe('Proposta')
    expect(doc.status).toBe('RASCUNHO')
    expect(doc.eventos[0].descricao).toContain('ffffffffffff')
  })

  it('recusa nome vazio', () => {
    expect(() => r.criarDocumento('   ', 1, 'x')).toThrow(r.ErroDeRegra)
  })
})

describe('signatários', () => {
  it('numera na ordem de entrada e dá uma cor pra cada um', () => {
    const { doc } = documentoComDuasPessoas()
    expect(doc.signatarios.map((s) => s.ordem)).toEqual([1, 2])
    expect(doc.signatarios[0].cor).not.toBe(doc.signatarios[1].cor)
  })

  it('não aceita o mesmo e-mail duas vezes, nem com maiúscula', () => {
    const { doc } = documentoComDuasPessoas()
    expect(() => r.adicionarSignatario(doc, 'Ana de novo', 'ANA@exemplo.com')).toThrow('já está na lista')
  })

  it('recusa e-mail inválido', () => {
    const doc = r.criarDocumento('X', 1, 'h')
    expect(() => r.adicionarSignatario(doc, 'Ana', 'ana@')).toThrow('E-mail inválido')
  })

  it('ao remover, refaz a ordem e apaga os campos da pessoa', () => {
    const { doc, ana } = documentoComDuasPessoas()
    r.removerSignatario(doc, ana.id)
    expect(doc.signatarios).toHaveLength(1)
    expect(doc.signatarios[0].ordem).toBe(1)
    expect(doc.campos.every((c) => c.signatarioId !== ana.id)).toBe(true)
  })
})

describe('campos', () => {
  it('recusa campo fora da página', () => {
    const { doc, ana } = documentoComDuasPessoas()
    expect(() => r.salvarCampos(doc, [{ id: 'x', signatarioId: ana.id, pagina: 1, x: 0.9, y: 0.1, largura: 0.3, altura: 0.1 }])).toThrow(
      'fora da página',
    )
  })

  it('recusa campo numa página que não existe', () => {
    const { doc, ana } = documentoComDuasPessoas()
    expect(() => r.salvarCampos(doc, [{ id: 'x', signatarioId: ana.id, pagina: 3, x: 0, y: 0, largura: 0.2, altura: 0.1 }])).toThrow(
      'fora das páginas',
    )
  })
})

describe('envio', () => {
  it('não envia se alguém está sem campo, e diz quem', () => {
    const doc = r.criarDocumento('X', 1, 'h')
    r.adicionarSignatario(doc, 'Ana Lima', 'ana@exemplo.com')
    expect(() => r.enviarParaAssinatura(doc)).toThrow('Ana Lima')
  })

  it('depois de enviado, o documento fica travado para edição', () => {
    const { doc } = documentoComDuasPessoas()
    r.enviarParaAssinatura(doc)
    expect(doc.status).toBe('AGUARDANDO')
    expect(() => r.adicionarSignatario(doc, 'Caio', 'caio@exemplo.com')).toThrow('não pode mais ser alterado')
  })
})

describe('assinatura', () => {
  it('respeita a ordem: o segundo não assina antes do primeiro', () => {
    const { doc, bruno } = documentoComDuasPessoas()
    r.enviarParaAssinatura(doc)
    expect(() => r.assinar(doc, bruno.id, PNG)).toThrow('Ainda não é a vez de Bruno Reis')
  })

  it('conclui quando a última pessoa assina e registra cada passo', () => {
    const { doc, ana, bruno } = documentoComDuasPessoas()
    r.enviarParaAssinatura(doc)
    r.assinar(doc, ana.id, PNG, new Date('2026-11-26T10:00:00Z'))
    expect(r.proximoSignatario(doc)?.id).toBe(bruno.id)
    expect(r.progresso(doc)).toBe(0.5)

    r.assinar(doc, bruno.id, PNG)
    expect(doc.status).toBe('CONCLUIDO')
    expect(r.progresso(doc)).toBe(1)
    expect(doc.signatarios[0].assinadoEm).toBe('2026-11-26T10:00:00.000Z')
    expect(doc.eventos.map((e) => e.tipo)).toEqual(['CRIADO', 'SIGNATARIO', 'SIGNATARIO', 'ENVIADO', 'ASSINADO', 'ASSINADO', 'CONCLUIDO'])
  })

  it('não deixa assinar duas vezes nem em rascunho', () => {
    const { doc, ana } = documentoComDuasPessoas()
    expect(() => r.assinar(doc, ana.id, PNG)).toThrow('ainda não foi enviado')
    r.enviarParaAssinatura(doc)
    r.assinar(doc, ana.id, PNG)
    expect(() => r.assinar(doc, ana.id, PNG)).toThrow('já assinou')
  })

  it('só aceita imagem PNG', () => {
    const { doc, ana } = documentoComDuasPessoas()
    r.enviarParaAssinatura(doc)
    expect(() => r.assinar(doc, ana.id, 'javascript:alert(1)')).toThrow('Assinatura inválida')
  })
})
