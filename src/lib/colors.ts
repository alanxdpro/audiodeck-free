export type RGB = { r: number, g: number, b: number }

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to255 = (x: number) => Math.round(255 * x)
  const rgb = [to255(f(0)), to255(f(8)), to255(f(4))]
  return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

export function relativeLuminance({ r, g, b }: RGB): number {
  const srgb = [r, g, b].map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

export function contrastRatio(hex1: string, hex2: string): number {
  const L1 = relativeLuminance(hexToRgb(hex1))
  const L2 = relativeLuminance(hexToRgb(hex2))
  const light = Math.max(L1, L2), dark = Math.min(L1, L2)
  return (light + 0.05) / (dark + 0.05)
}

export function pickAccessibleTextColor(bgHex: string): string {
  const white = '#FFFFFF', black = '#000000'
  const cWhite = contrastRatio(bgHex, white)
  const cBlack = contrastRatio(bgHex, black)
  return cWhite >= 4.5 || cWhite >= cBlack ? white : black
}

export function generateHarmonicPalette(n: number, seedHue?: number): string[] {
  const base = (typeof seedHue === 'number' ? seedHue : Math.floor(Math.random() * 360))
  const step = Math.floor(360 / n)
  const hues = Array.from({ length: n }).map((_, i) => (base + i * step) % 360)
  return hues.map(h => hslToHex(h, 60, 72))
}

