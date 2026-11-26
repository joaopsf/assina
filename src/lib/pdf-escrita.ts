// Tudo que ESCREVE PDF (pdf-lib). Carregado sob demanda: só o contrato de exemplo
// e o download do PDF assinado usam, então não pesa na abertura do app.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { encaixar, relativoParaPdf } from './coordenadas'
import type { DocumentoGQL } from '../graphql/tipos'

/** Contrato de exemplo, gerado na hora, pra quem abrir a demo testar sem ter um PDF. */
export async function contratoDeExemplo(): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create()
  const fonte = await pdf.embedFont(StandardFonts.Helvetica)
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold)
  const tinta = rgb(0.12, 0.14, 0.18)
  const cinza = rgb(0.45, 0.48, 0.52)

  const clausulas = [
    [
      '1. Objeto',
      'A CONTRATADA prestará serviços de desenvolvimento de interface para a plataforma web da CONTRATANTE, conforme o escopo descrito no Anexo I.',
    ],
    [
      '2. Prazo',
      'O contrato vigora por 6 (seis) meses a partir da data da última assinatura, podendo ser renovado por acordo entre as partes.',
    ],
    ['3. Remuneração', 'A CONTRATANTE pagará o valor mensal combinado até o dia 10 de cada mês, mediante emissão de nota fiscal.'],
    [
      '4. Confidencialidade',
      'As partes manterão sigilo sobre informações técnicas e comerciais a que tiverem acesso durante a execução deste contrato.',
    ],
    ['5. Rescisão', 'Qualquer das partes pode encerrar o contrato com aviso prévio de 30 (trinta) dias, sem multa.'],
    ['6. Foro', 'Fica eleito o foro da comarca de Belo Horizonte/MG para dirimir quaisquer dúvidas oriundas deste contrato.'],
  ]

  const quebrar = (texto: string, largura: number, tamanho: number) => {
    const linhas: string[] = []
    let linha = ''
    for (const palavra of texto.split(' ')) {
      const teste = linha ? `${linha} ${palavra}` : palavra
      if (fonte.widthOfTextAtSize(teste, tamanho) > largura) {
        linhas.push(linha)
        linha = palavra
      } else linha = teste
    }
    return [...linhas, linha]
  }

  const p1 = pdf.addPage([595, 842])
  p1.drawText('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', { x: 60, y: 770, size: 16, font: negrito, color: tinta })
  p1.drawText('Documento de exemplo gerado pelo Assina. Não tem valor legal.', { x: 60, y: 748, size: 9, font: fonte, color: cinza })
  let y = 700
  for (const [titulo, texto] of clausulas) {
    p1.drawText(titulo, { x: 60, y, size: 11, font: negrito, color: tinta })
    y -= 18
    for (const l of quebrar(texto, 475, 10.5)) {
      p1.drawText(l, { x: 60, y, size: 10.5, font: fonte, color: tinta })
      y -= 15
    }
    y -= 14
  }

  const p2 = pdf.addPage([595, 842])
  p2.drawText('ASSINATURAS', { x: 60, y: 770, size: 14, font: negrito, color: tinta })
  p2.drawText('E, por estarem de acordo, as partes assinam este contrato eletronicamente.', {
    x: 60,
    y: 745,
    size: 10.5,
    font: fonte,
    color: tinta,
  })
  for (const [i, papel] of ['CONTRATANTE', 'CONTRATADA', 'TESTEMUNHA'].entries()) {
    const linhaY = 620 - i * 150
    p2.drawLine({ start: { x: 60, y: linhaY }, end: { x: 330, y: linhaY }, thickness: 0.8, color: cinza })
    p2.drawText(papel, { x: 60, y: linhaY - 16, size: 9.5, font: negrito, color: cinza })
  }

  const bytes = await pdf.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

const dataBR = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo' })

/** Carimba as assinaturas nos campos e acrescenta a página de auditoria no fim. */
export async function gerarPdfAssinado(original: ArrayBuffer, doc: DocumentoGQL): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original)
  const fonte = await pdf.embedFont(StandardFonts.Helvetica)
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdf.embedFont(StandardFonts.Courier)
  const tinta = rgb(0.12, 0.14, 0.18)
  const cinza = rgb(0.45, 0.48, 0.52)
  const paginas = pdf.getPages()

  for (const s of doc.signatarios) {
    if (!s.assinatura) continue
    const png = await pdf.embedPng(s.assinatura)
    for (const campo of doc.campos.filter((c) => c.signatarioId === s.id)) {
      const pagina = paginas[campo.pagina - 1]
      const { width, height } = pagina.getSize()
      const caixa = relativoParaPdf(campo, width, height)
      const lugar = encaixar(png.width, png.height, caixa)
      pagina.drawImage(png, { x: lugar.x, y: lugar.y, width: lugar.largura, height: lugar.altura })
      pagina.drawText(`${s.nome} · ${dataBR(s.assinadoEm!)}`, { x: caixa.x, y: caixa.y - 9, size: 6.5, font: fonte, color: cinza })
    }
  }

  const a = pdf.addPage([595, 842])
  let y = 770
  a.drawText('Trilha de auditoria', { x: 60, y, size: 16, font: negrito, color: tinta })
  y -= 30
  const linha = (rotulo: string, valor: string, f = fonte) => {
    a.drawText(rotulo, { x: 60, y, size: 9, font: negrito, color: cinza })
    a.drawText(valor, { x: 170, y, size: 9, font: f, color: tinta })
    y -= 16
  }
  linha('Documento', doc.nome)
  linha('Páginas', String(doc.paginas))
  linha('SHA-256 original', doc.hash.slice(0, 32), mono)
  linha('', doc.hash.slice(32), mono)
  linha('Criado em', dataBR(doc.criadoEm))

  y -= 14
  a.drawText('Signatários', { x: 60, y, size: 12, font: negrito, color: tinta })
  y -= 22
  for (const s of doc.signatarios) {
    a.drawText(`${s.ordem}. ${s.nome}`, { x: 60, y, size: 10, font: negrito, color: tinta })
    a.drawText(`${s.email} · assinou em ${s.assinadoEm ? dataBR(s.assinadoEm) : 'pendente'}`, {
      x: 60,
      y: y - 13,
      size: 9,
      font: fonte,
      color: cinza,
    })
    y -= 34
  }

  y -= 6
  a.drawText('Eventos', { x: 60, y, size: 12, font: negrito, color: tinta })
  y -= 20
  for (const e of doc.eventos) {
    if (y < 60) break
    a.drawText(dataBR(e.em), { x: 60, y, size: 8.5, font: mono, color: cinza })
    a.drawText(e.descricao.slice(0, 80), { x: 190, y, size: 8.5, font: fonte, color: tinta })
    y -= 14
  }

  a.drawText('Gerado pelo Assina, projeto de demonstração. Sem validade jurídica.', { x: 60, y: 40, size: 8, font: fonte, color: cinza })
  return pdf.save()
}
