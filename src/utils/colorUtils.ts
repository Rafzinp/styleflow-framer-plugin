export function toHex(color: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase()
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [r, g, b] = color.slice(1).split("")
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return color
}

export function toPickerHex(color: string): string {
  const h = toHex(color)
  return /^#[0-9A-Fa-f]{6}$/.test(h) ? h : "#000000"
}

export function hexToRgb(hex: string): string {
  const h = toHex(hex)
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return "—"
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

export function contrastColor(hex: string): string {
  const h = toHex(hex)
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return "#fff"
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? "#000" : "#fff"
}
