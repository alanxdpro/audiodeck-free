const KEY = "audiodeck_free_v1"
export function loadState<T>(): T | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as T : null } catch { return null }
}
export async function loadElectronState<T>(): Promise<T | null> {
  try {
    const api = (window as any).electronAPI
    if (!api) return null
    const data = await api.readState()
    return data ?? null
  } catch { return null }
}
export function saveState<T>(state: T): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  try {
    const api = (window as any).electronAPI
    if (api) api.writeState(state)
  } catch {}
}
