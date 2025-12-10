export function fmtTime(n: number): string {
  const m = Math.floor(n / 60)
  const s = Math.floor(n % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

