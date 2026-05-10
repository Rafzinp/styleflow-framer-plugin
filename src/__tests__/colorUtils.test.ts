import { describe, it, expect } from "vitest"
import { toHex, toPickerHex, hexToRgb, contrastColor } from "../utils/colorUtils"

describe("toHex", () => {
  it("uppercases a valid 6-char hex", () => {
    expect(toHex("#aabbcc")).toBe("#AABBCC")
  })

  it("expands a 3-char shorthand hex", () => {
    expect(toHex("#abc")).toBe("#AABBCC")
  })

  it("returns the input unchanged for unknown formats", () => {
    expect(toHex("red")).toBe("red")
  })

  it("handles already-uppercase input", () => {
    expect(toHex("#FF0000")).toBe("#FF0000")
  })
})

describe("toPickerHex", () => {
  it("returns the hex for a valid color", () => {
    expect(toPickerHex("#123456")).toBe("#123456")
  })

  it("falls back to #000000 for invalid input", () => {
    expect(toPickerHex("not-a-color")).toBe("#000000")
  })

  it("expands shorthand then validates", () => {
    expect(toPickerHex("#fff")).toBe("#FFFFFF")
  })
})

describe("hexToRgb", () => {
  it("returns space-separated RGB for a valid hex", () => {
    expect(hexToRgb("#ff0000")).toBe("255 0 0")
  })

  it("returns — for invalid hex", () => {
    expect(hexToRgb("bad")).toBe("—")
  })

  it("handles shorthand hex via expansion", () => {
    expect(hexToRgb("#000")).toBe("0 0 0")
  })
})

describe("contrastColor", () => {
  it("returns #000 for a light background", () => {
    expect(contrastColor("#ffffff")).toBe("#000")
  })

  it("returns #fff for a dark background", () => {
    expect(contrastColor("#000000")).toBe("#fff")
  })

  it("returns #fff for invalid hex", () => {
    expect(contrastColor("bad")).toBe("#fff")
  })

  it("handles mid-range correctly", () => {
    // ~0.55 luminance boundary — yellow (#ffff00) is bright
    expect(contrastColor("#ffff00")).toBe("#000")
  })
})
