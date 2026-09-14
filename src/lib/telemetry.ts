export interface Telemetry {
  source: "live" | "demo";
  updatedAt: string;
  machines: { id: string; name: string; dorm: string; status: "available" | "in_use"; minutesLeft?: number }[];
  rooms: { id: string; name: string; capacity: number; occupied: number }[];
  noise: { id: string; name: string; db: number }[];
}
export function validTelemetry(value: unknown): value is Telemetry {
  if (!value || typeof value !== "object") return false;
  const v = value as Telemetry;
  return typeof v.updatedAt === "string" && Number.isFinite(Date.parse(v.updatedAt))
    && Array.isArray(v.machines) && v.machines.every(m => typeof m.id === "string" && typeof m.name === "string" && typeof m.dorm === "string" && ["available", "in_use"].includes(m.status) && (m.minutesLeft === undefined || Number.isFinite(m.minutesLeft) && m.minutesLeft >= 0))
    && Array.isArray(v.rooms) && v.rooms.every(r => typeof r.id === "string" && typeof r.name === "string" && Number.isInteger(r.capacity) && r.capacity > 0 && Number.isInteger(r.occupied) && r.occupied >= 0 && r.occupied <= r.capacity)
    && Array.isArray(v.noise) && v.noise.every(n => typeof n.id === "string" && typeof n.name === "string" && Number.isFinite(n.db) && n.db >= 0 && n.db <= 200);
}
