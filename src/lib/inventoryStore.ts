export type Defect = { type: string; level?: string };
export type PartDefects = { partId: string; list: Defect[] };
export type InventoryItem = {
  id: string;
  date: string;
  evaluation: any; // EvaluationScore 互換
  partDefects: PartDefects[];
};

const KEY = "usedcar.inventory.v1";

export function loadInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as InventoryItem[];
    return [];
  } catch {
    return [];
  }
}

export function saveInventory(items: InventoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function upsertItem(item: InventoryItem) {
  const items = loadInventory();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.unshift(item);
  saveInventory(items);
}

export function removeItem(id: string) {
  const items = loadInventory().filter((i) => i.id !== id);
  saveInventory(items);
}
