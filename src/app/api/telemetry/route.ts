import { database } from "@/db";
import { INITIAL_LAUNDRY, NOISE_ZONES, DEMO_ROOMS } from "@/lib/telemetry-demo";
import { getCurrentUser } from "@/lib/server/auth";
import { err, ok } from "@/lib/server/util";
import { validTelemetry } from "@/lib/telemetry";
export async function GET() {
  if (!await getCurrentUser()) return err(401, "no_session", "Not signed in.");
  const endpoint = process.env.IOT_API_URL;
  if (!endpoint) return recorded({
    source: "demo", updatedAt: new Date().toISOString(),
    machines: INITIAL_LAUNDRY,
    rooms: DEMO_ROOMS,
    noise: NOISE_ZONES.map(n => ({ id: n.id, name: n.zone, db: n.db })),
  });
  try {
    const res = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(8000), headers: process.env.IOT_API_TOKEN ? { Authorization: `Bearer ${process.env.IOT_API_TOKEN}` } : {} });
    if (!res.ok) throw new Error("Sensor service unavailable");
    const data: unknown = await res.json();
    if (!validTelemetry(data)) return err(502, "invalid_feed", "Sensor feed has invalid readings.");
    return recorded({ ...data, source: "live" });
  } catch { return err(503, "sensor_offline", "Campus sensors are currently unavailable. Try refreshing."); }
}

async function recorded(data:Record<string,unknown>){
 try{const db=database();const stamp=Date.parse(String(data.updatedAt));
 await db.batch([
 db.prepare('INSERT OR IGNORE INTO telemetry_readings (id,source,data,captured_at) VALUES (?,?,?,?)').bind(`${data.source}:${Math.floor(stamp/30000)}`,String(data.source),JSON.stringify(data),stamp),
 db.prepare('DELETE FROM telemetry_readings WHERE captured_at < ?').bind(Date.now()-7*86400000)
 ]);return ok(data);
 }catch(e){console.error('telemetry archive',e);return err(503,'storage','Sensor history could not be saved. Please retry.');}
}
