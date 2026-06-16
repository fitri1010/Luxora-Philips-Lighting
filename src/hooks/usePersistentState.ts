/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";

/**
 * Namespace prefix for all LUXORA localStorage keys. Bumping the version
 * effectively invalidates previously persisted data after a breaking change.
 */
export const STORAGE_PREFIX = "luxora:v1:";

/**
 * Drop-in replacement for useState that persists the value to localStorage.
 * The state is hydrated from storage on first render (falling back to
 * `initialValue`), and written back whenever it changes.
 *
 * Transient UI state (modals, search input, etc.) should keep using plain
 * useState — only durable business/user data belongs here.
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const storageKey = STORAGE_PREFIX + key;

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      // Corrupt JSON or storage unavailable (private mode) → use default.
      return initialValue;
    }
  });

  // Avoid re-writing on the very first render right after hydration.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Ignore quota / availability errors — persistence is best-effort.
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
}

/**
 * Removes all persisted LUXORA data, restoring the app to its seed state on
 * the next reload. Wire this to a "Reset Data" button when needed.
 */
export function clearPersistedData(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(STORAGE_PREFIX),
    );
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // No-op if storage is unavailable.
  }
}
