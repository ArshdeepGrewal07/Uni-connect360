import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
export function database(): D1Database {
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding) throw new Error("Persistent database is unavailable. Apply the database migrations and start with the configured DB binding.");
  return binding;
}
// Keep binding access request-local; no fallback to ephemeral memory.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, property) {
    const instance = drizzle(database());
    const value = Reflect.get(instance, property);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
