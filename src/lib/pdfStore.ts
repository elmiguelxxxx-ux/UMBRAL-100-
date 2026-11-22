// Guarda el binario original de los PDFs en IndexedDB (no en localStorage/window.storage,
// que están pensados para JSON pequeño). Esto permite renderizar el documento tal cual era,
// además del texto plano que ya se extrae para la IA.

const DB_NAME = 'umbral-files';
const DB_VERSION = 1;
const STORE_NAME = 'pdf-originals';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Guarda (o sobreescribe) el ArrayBuffer original de un documento bajo su id. */
export const saveOriginalFile = async (id: string, buffer: ArrayBuffer): Promise<void> => {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(buffer, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

/** Recupera el ArrayBuffer original de un documento, o null si no existe. */
export const getOriginalFile = async (id: string): Promise<ArrayBuffer | null> => {
  const db = await openDb();
  try {
    const result = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as ArrayBuffer) || null);
      req.onerror = () => reject(req.error);
    });
    return result;
  } finally {
    db.close();
  }
};

/** Borra el binario de un documento (usar al eliminar el documento). */
export const deleteOriginalFile = async (id: string): Promise<void> => {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

/** Borra varios binarios de una vez (usar al eliminar una carpeta completa). */
export const deleteOriginalFiles = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      ids.forEach((id) => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};
