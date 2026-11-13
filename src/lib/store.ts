import { createLocalStore } from "./store/local";
import { createSupabaseStore } from "./store/supabase";
import type { Store } from "./store/types";

export type { Store } from "./store/types";

let cachedStore: Store | null = null;

export function getStore(): Store {
  if (cachedStore) return cachedStore;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  cachedStore =
    url && serviceRoleKey ? createSupabaseStore(url, serviceRoleKey) : createLocalStore();

  return cachedStore;
}

export function isUsingSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
