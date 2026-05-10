import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("framer-plugin", () => ({
  framer: {
    getColorStyles: vi.fn(),
    createColorStyle: vi.fn(),
  },
}))

import { framer } from "framer-plugin"
import { ColorTab } from "../tabs/ColorTab"

const mockStyle = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  name: "Brand/Primary",
  light: "#5b69f7",
  dark: "#3a4ad4",
  setAttributes: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

beforeEach(() => {
  vi.mocked(framer.getColorStyles).mockResolvedValue([mockStyle()] as never)
  vi.mocked(framer.createColorStyle).mockResolvedValue(undefined as never)
  localStorage.clear()
})

describe("ColorTab", () => {
  it("renders the color name after loading", async () => {
    const showToast = vi.fn()
    render(<ColorTab showToast={showToast} />)

    // Prefix is stripped: "Brand/Primary" → "Primary"
    await waitFor(() => expect(screen.getByText("Primary")).toBeInTheDocument())
  })

  it("shows hex value of the color in light mode", async () => {
    const showToast = vi.fn()
    render(<ColorTab showToast={showToast} />)

    await waitFor(() => expect(screen.getByText("#5B69F7")).toBeInTheDocument())
  })

  it("filters by search query", async () => {
    vi.mocked(framer.getColorStyles).mockResolvedValue([
      mockStyle({ id: "c1", name: "Brand/Primary", light: "#5b69f7" }),
      mockStyle({ id: "c2", name: "Core/Background", light: "#0f0f0f" }),
    ] as never)

    const showToast = vi.fn()
    render(<ColorTab showToast={showToast} />)

    await waitFor(() => expect(screen.getByText("Primary")).toBeInTheDocument())

    const input = screen.getByPlaceholderText("Search colors… (/)")
    await userEvent.type(input, "Core")

    expect(screen.queryByText("Primary")).not.toBeInTheDocument()
    expect(screen.getByText("Background")).toBeInTheDocument()
  })

  it("opens the add form when + button is clicked", async () => {
    const showToast = vi.fn()
    render(<ColorTab showToast={showToast} />)

    await waitFor(() => screen.getByText("Primary"))

    fireEvent.click(screen.getByTitle("Add color"))

    expect(screen.getByText("New Color Style")).toBeInTheDocument()
  })

  it("calls createColorStyle with correct args", async () => {
    const showToast = vi.fn()
    render(<ColorTab showToast={showToast} />)

    await waitFor(() => screen.getByText("Primary"))

    fireEvent.click(screen.getByTitle("Add color"))

    const nameInput = screen.getByPlaceholderText("Name — e.g. Brand/Primary")
    await userEvent.type(nameInput, "Neutral/White")

    fireEvent.click(screen.getByText("Create"))

    await waitFor(() =>
      expect(framer.createColorStyle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Neutral/White" }),
      ),
    )
  })

  it("shows empty state when no colors exist", async () => {
    vi.mocked(framer.getColorStyles).mockResolvedValue([] as never)

    const showToast = vi.fn()
    render(<ColorTab showToast={showToast} />)

    await waitFor(() =>
      expect(screen.getByText("No color styles yet")).toBeInTheDocument(),
    )
  })

  it("shows error toast on fetch failure", async () => {
    vi.mocked(framer.getColorStyles).mockRejectedValue(new Error("API error"))

    const showToast = vi.fn()
    render(<ColorTab showToast={showToast} />)

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Failed to load colors", "error"),
    )
  })
})
