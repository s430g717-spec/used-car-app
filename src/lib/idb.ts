// Minimal IndexedDB helper for storing images
const DB_NAME = "ucev-db";
const STORE = "images";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImageFromDataUrl(dataUrl: string): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const putReq = store.add({ dataUrl });
    putReq.onsuccess = () => resolve(String(putReq.result));
    putReq.onerror = () => reject(putReq.error);
  });
}

export async function getImageDataUrl(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const getReq = store.get(Number(id));
    getReq.onsuccess = () => {
      const rec = getReq.result as any;
      resolve(rec?.dataUrl ?? null);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

const urlCache = new Map<string, string>();
export async function getImageObjectUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const dataUrl = await getImageDataUrl(id);
  if (!dataUrl) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    urlCache.set(id, objUrl);
    return objUrl;
  } catch {
    return dataUrl; // fallback
  }
}

export async function listImageRecords(): Promise<
  Array<{ id: number; dataUrl: string }>
> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = (req.result as any[]) || [];
      resolve(
        rows.map((r: any) => ({
          id: r.id as number,
          dataUrl: r.dataUrl as string,
        }))
      );
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImage(id: string | number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.delete(Number(id));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
