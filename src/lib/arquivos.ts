// O PDF original fica no IndexedDB (o localStorage não aguenta arquivo).
// Wrapper mínimo, sem biblioteca: uma loja, chave = id do documento.
const BANCO = 'assina'
const LOJA = 'pdfs'

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, erro) => {
    const req = indexedDB.open(BANCO, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(LOJA)
    req.onsuccess = () => ok(req.result)
    req.onerror = () => erro(req.error)
  })
}

async function transacao<T>(modo: IDBTransactionMode, fn: (loja: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir()
  return new Promise((ok, erro) => {
    const req = fn(db.transaction(LOJA, modo).objectStore(LOJA))
    req.onsuccess = () => ok(req.result)
    req.onerror = () => erro(req.error)
  })
}

export const guardarPdf = (id: string, bytes: ArrayBuffer) => transacao('readwrite', (l) => l.put(bytes, id))
export const lerPdf = (id: string) => transacao<ArrayBuffer | undefined>('readonly', (l) => l.get(id))
export const apagarPdf = (id: string) => transacao('readwrite', (l) => l.delete(id))
