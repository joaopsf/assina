import { shallowRef, ref, watch, type Ref } from 'vue'
import { carregarPdf, type PdfCarregado } from './pdf'
import { lerPdf } from './arquivos'

/** Carrega o PDF guardado do documento. shallowRef: o objeto do pdf.js não pode virar reativo. */
export function usePdf(documentoId: Ref<string>) {
  const pdf = shallowRef<PdfCarregado | null>(null)
  const bytes = shallowRef<ArrayBuffer | null>(null)
  const erro = ref<string | null>(null)

  watch(
    documentoId,
    async (id) => {
      pdf.value = null
      erro.value = null
      try {
        const guardado = await lerPdf(id)
        if (!guardado) throw new Error('O arquivo deste documento não está mais neste navegador.')
        bytes.value = guardado
        pdf.value = await carregarPdf(guardado)
      } catch (e) {
        erro.value = e instanceof Error ? e.message : 'Não foi possível abrir o PDF.'
      }
    },
    { immediate: true },
  )

  return { pdf, bytes, erro }
}
