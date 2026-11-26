// Tudo que LÊ e desenha PDF (pdf.js, com o trabalho pesado num worker).
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export type PdfCarregado = pdfjs.PDFDocumentProxy

export async function carregarPdf(bytes: ArrayBuffer): Promise<PdfCarregado> {
  // pdf.js transfere o buffer pro worker; uma cópia mantém o original utilizável.
  return pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise
}

/** Desenha a página no canvas na largura pedida, nítida em tela de alta densidade. */
export async function desenharPagina(pdf: PdfCarregado, numero: number, canvas: HTMLCanvasElement, largura: number) {
  const pagina = await pdf.getPage(numero)
  const base = pagina.getViewport({ scale: 1 })
  const dpr = window.devicePixelRatio || 1
  const viewport = pagina.getViewport({ scale: (largura / base.width) * dpr })
  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width = `${largura}px`
  canvas.style.height = `${viewport.height / dpr}px`
  await pagina.render({ canvas, viewport }).promise
}
