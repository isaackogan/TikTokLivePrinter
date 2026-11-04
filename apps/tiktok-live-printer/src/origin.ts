/** Browsers send Origin on cross-site requests; only our own page may drive the printer. */
export function isAllowedOrigin(origin: string | null, port: number): boolean {
  if (!origin) return true;
  return origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`;
}
