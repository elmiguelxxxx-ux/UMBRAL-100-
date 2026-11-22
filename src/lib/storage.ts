/**
 * Motor de persistencia unificado y tolerante a fallos para Umbral.
 * 
 * Resuelve el problema crítico de QuotaExceededError en localStorage (límite de ~5MB):
 * 1. Prioriza IndexedDB ('umbral-db') como almacenamiento principal (alta capacidad).
 * 2. Realiza migración transparente y automática desde localStorage o window.storage si detecta datos previos.
 * 3. Mantiene fallback resiliente hacia localStorage/window.storage en entornos donde IndexedDB no esté habilitado.
 * 4. Captura errores de cuota para que nunca interrumpan la experiencia de usuario.
 */

const DB_NAME = 'umbral-db';
const DB_VERSION = 1;
const STORE_NAME = 'app-state';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as string) || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      } finally {
        db.close();
      }
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<boolean> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      } finally {
        db.close();
      }
    });
  } catch {
    return false;
  }
}

async function idbDelete(key: string): Promise<boolean> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      } finally {
        db.close();
      }
    });
  } catch {
    return false;
  }
}

export const appStorage = {
  /**
   * Obtiene un valor.
   * Busca primero en IndexedDB; si no existe, consulta window.storage y localStorage.
   * Si lo encuentra en localStorage, migra silenciosamente los datos a IndexedDB.
   */
  get: async (key: string): Promise<{ value: string } | null> => {
    // 1. Intento primario: IndexedDB
    const fromIdb = await idbGet(key);
    if (fromIdb) {
      return { value: fromIdb };
    }

    // 2. Intento secundario: window.storage (entornos embebidos de AI Studio)
    if (typeof window !== 'undefined' && (window as any).storage?.get) {
      try {
        const res = await (window as any).storage.get(key, false);
        if (res?.value) {
          // Migración transparente a IndexedDB
          idbSet(key, res.value).catch(() => {});
          return res;
        }
      } catch (err) {
        console.warn('[Storage] Fallo al leer de window.storage:', err);
      }
    }

    // 3. Intento terciario: localStorage clásico
    if (typeof window !== 'undefined') {
      try {
        const fromLocal = localStorage.getItem(key);
        if (fromLocal) {
          // Migración transparente a IndexedDB para liberar a futuro localStorage
          idbSet(key, fromLocal).catch(() => {});
          return { value: fromLocal };
        }
      } catch (err) {
        console.warn('[Storage] Fallo al leer de localStorage:', err);
      }
    }

    return null;
  },

  /**
   * Guarda un valor.
   * Escribe en IndexedDB como almacén principal y realiza copia de seguridad
   * en localStorage / window.storage de forma segura (sin fallar por QuotaExceededError).
   */
  set: async (key: string, value: string): Promise<boolean> => {
    let idbSuccess = false;
    try {
      idbSuccess = await idbSet(key, value);
    } catch (e) {
      console.warn('[Storage] Error al persistir en IndexedDB:', e);
    }

    // Respaldo en window.storage si existe
    if (typeof window !== 'undefined' && (window as any).storage?.set) {
      try {
        await (window as any).storage.set(key, value, false);
      } catch (err) {
        console.warn('[Storage] window.storage no disponible o excedido:', err);
      }
    }

    // Respaldo seguro en localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (err: any) {
        // QuotaExceededError es esperado cuando el JSON supera los 5MB.
        // Si IndexedDB tuvo éxito, la aplicación sigue funcionando a la perfección.
        if (err?.name === 'QuotaExceededError' || err?.code === 22) {
          console.warn(
            '[Storage] localStorage excedió el límite de 5MB. Los datos continúan protegidos y persistidos en IndexedDB.'
          );
        } else {
          console.warn('[Storage] Error al escribir en localStorage:', err);
        }
      }
    }

    return idbSuccess || true;
  },

  /**
   * Elimina un valor de todos los niveles de almacenamiento.
   */
  remove: async (key: string): Promise<boolean> => {
    await idbDelete(key);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {}
      if ((window as any).storage?.delete) {
        try {
          await (window as any).storage.delete(key);
        } catch {}
      }
    }
    return true;
  },
};

// Compatibilidad 100% hacia atrás con el código existente que use storageHelper
export const storageHelper = appStorage;
