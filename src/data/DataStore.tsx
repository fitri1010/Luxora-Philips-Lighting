/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

type Doc = Record<string, unknown>;
type Row = Record<string, unknown>;

interface DataStoreValue {
  doc: Doc;
  setField: (key: string, updater: (prev: unknown) => unknown) => void;
  reset: () => Promise<void>;
  saving: boolean;
}

const DataStoreContext = createContext<DataStoreValue | null>(null);
const SAVE_DEBOUNCE_MS = 600;

// Map the in-memory document keys (used by useField) to normalized DB tables.
const TABLES: { docKey: string; table: string; pk: string }[] = [
  { docKey: "orders", table: "orders", pk: "order_id" },
  { docKey: "pos", table: "pos_transactions", pk: "transaction_id" },
  { docKey: "inventory", table: "inventory_items", pk: "sku" },
  { docKey: "risks", table: "risk_items", pk: "id" },
  { docKey: "zakat", table: "zakat_records", pk: "id" },
  { docKey: "anomalies", table: "anomalies", pk: "id" }
];
const TABLE_DOC_KEYS = TABLES.map((t) => t.docKey);

const stripShopId = (row: Row): Row => {
  const { shop_id, ...rest } = row;
  void shop_id;
  return rest;
};

// Load the whole shop document by reading each table + settings blob.
async function loadShopDoc(shopId: string): Promise<Doc> {
  const doc: Doc = {};
  for (const { docKey, table } of TABLES) {
    const { data, error } = await supabase.from(table).select("*").eq("shop_id", shopId);
    doc[docKey] = error ? [] : (data || []).map(stripShopId);
  }
  const { data: s } = await supabase.from("shop_settings").select("doc").eq("shop_id", shopId).maybeSingle();
  if (s?.doc && typeof s.doc === "object") Object.assign(doc, s.doc);
  return doc;
}

// Sync one table to match the given rows (upsert present rows, delete removed ones).
async function syncTable(table: string, pk: string, shopId: string, rows: Row[]) {
  if (rows.length) {
    const payload = rows.map((r) => ({ ...r, shop_id: shopId }));
    await supabase.from(table).upsert(payload, { onConflict: `shop_id,${pk}` });
  }
  const { data: existing } = await supabase.from(table).select(pk).eq("shop_id", shopId);
  const keep = new Set(rows.map((r) => r[pk]));
  const toDelete = (existing || []).map((e) => (e as unknown as Row)[pk]).filter((k) => !keep.has(k));
  if (toDelete.length) await supabase.from(table).delete().eq("shop_id", shopId).in(pk, toDelete as string[]);
}

async function saveShopDoc(shopId: string, doc: Doc) {
  for (const { docKey, table, pk } of TABLES) {
    const rows = (Array.isArray(doc[docKey]) ? doc[docKey] : []) as Row[];
    await syncTable(table, pk, shopId, rows);
  }
  // Everything that is not a normalized table lives in the settings blob.
  const settings: Doc = {};
  for (const k of Object.keys(doc)) {
    if (!TABLE_DOC_KEYS.includes(k)) settings[k] = doc[k];
  }
  await supabase
    .from("shop_settings")
    .upsert({ shop_id: shopId, doc: settings, updated_at: new Date().toISOString() });
}

export function DataProvider({ children, shopId }: { children: React.ReactNode; shopId: string }) {
  const [doc, setDoc] = useState<Doc>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    setLoaded(false);
    setDoc({});
    skipNextSave.current = true;
    loadShopDoc(shopId)
      .then((d) => setDoc(d))
      .catch(() => setDoc({}))
      .finally(() => setLoaded(true));
  }, [shopId]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaving(true);
    const t = setTimeout(() => {
      saveShopDoc(shopId, doc).finally(() => setSaving(false));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [doc, loaded, shopId]);

  const setField = useCallback((key: string, updater: (prev: unknown) => unknown) => {
    setDoc((prev) => ({ ...prev, [key]: updater(prev[key]) }));
  }, []);

  const reset = useCallback(async () => {
    await saveShopDoc(shopId, {});
    setDoc({});
  }, [shopId]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-slate-950 text-emerald-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <DataStoreContext.Provider value={{ doc, setField, reset, saving }}>
      {children}
    </DataStoreContext.Provider>
  );
}

function useDataStore(): DataStoreValue {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useField/useDataStore must be used within a DataProvider");
  return ctx;
}

/** Drop-in replacement for usePersistentState, backed by normalized per-shop tables. */
export function useField<T>(key: string, initial: T) {
  const { doc, setField } = useDataStore();
  const value = (key in doc ? doc[key] : initial) as T;

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      setField(key, (prev) => {
        const base = (prev === undefined ? initial : prev) as T;
        return typeof action === "function" ? (action as (p: T) => T)(base) : action;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [value, setValue] as const;
}

export function useResetData() {
  return useDataStore().reset;
}

export function useDataSaving() {
  return useDataStore().saving;
}
