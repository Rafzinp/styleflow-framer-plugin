import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("framer-plugin", () => ({
  framer: {
    getTextStyles: vi.fn(),
    getFont: vi.fn(),
    createTextStyle: vi.fn(),
  },
}))

import { framer } from "framer-plugin"
import { TypographyTab } from "../tabs/TypographyTab"

// Mirror the shape the Framer API actually returns
const mockStyle = (overrides: Record<string, unknown> = {}) => ({
  id: "t1",
  name: "Brand/Heading",
  font: { family: "Inter", weight: 700 },
  fontSize: "32px",
  lineHeight: "1.2",
  letterSpacing: "0em",
  setAttributes: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

beforeEach(() => {
  vi.mocked(framer.getTextStyles).mockResolvedValue([mockStyle()] as never)
  vi.mocked(framer.getFont).mockResolvedValue({ family: "Inter" } as never)
  vi.mocked(framer.createTextStyle).mockResolvedValue(undefined as never)
})

describe("TypographyTab", () => {
  it("renders the style name after loading", async () => {
    const showToast = vi.fn()
    render(<TypographyTab showToast={showToast} />)

    // Prefix is stripped: "Brand/Heading" → "Heading"
    await waitFor(() => expect(screen.getByText("Heading")).toBeInTheDocument())
  })

  it("shows the font family and size", async () => {
    const showToast = vi.fn()
    render(<TypographyTab showToast={showToast} />)

    await waitFor(() => {
      // srow-meta renders "{fontFamily} · {fontWeight}"
      expect(screen.getByText("Inter · 700")).toBeInTheDocument()
      // srow-tag renders "{fontSize}px"
      expect(screen.getByText("32px")).toBeInTheDocument()
    })
  })

  it("filters by search query", async () => {
    vi.mocked(framer.getTextStyles).mockResolvedValue([
      mockStyle({ id: "t1", name: "Brand/Heading" }),
      mockStyle({ id: "t2", name: "Body/Paragraph", font: { family: "Geist", weight: 400 } }),
    ] as never)

    const showToast = vi.fn()
    render(<TypographyTab showToast={showToast} />)

    await waitFor(() => expect(screen.getByText("Heading")).toBeInTheDocument())

    const input = screen.getByPlaceholderText(/Search styles/)
    await userEvent.type(input, "Body")

    expect(screen.queryByText("Heading")).not.toBeInTheDocument()
    expect(screen.getByText("Paragraph")).toBeInTheDocument()
  })

  it("shows empty state when no text styles exist", async () => {
    vi.mocked(framer.getTextStyles).mockResolvedValue([] as never)

    const showToast = vi.fn()
    render(<TypographyTab showToast={showToast} />)

    await waitFor(() =>
      expect(screen.getByText("No text styles yet")).toBeInTheDocument(),
    )
  })

  it("shows error toast when fetch fails", async () => {
    vi.mocked(framer.getTextStyles).mockRejectedValue(new Error("Framer error"))

    const showToast = vi.fn()
    render(<TypographyTab showToast={showToast} />)

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Failed to load styles", "error"),
    )
  })

  it("opens the add form when + button is clicked", async () => {
    const showToast = vi.fn()
    render(<TypographyTab showToast={showToast} />)

    await waitFor(() => screen.getByText("Heading"))

    // Button title is "New style" in the component
    fireEvent.click(screen.getByTitle("New style"))

    expect(screen.getByText("New Text Style")).toBeInTheDocument()
  })

  it("disables Create button when name is empty", async () => {
    const showToast = vi.fn()
    render(<TypographyTab showToast={showToast} />)

    await waitFor(() => screen.getByText("Heading"))
    fireEvent.click(screen.getByTitle("New style"))

    const createBtn = screen.getByText("Create")
    expect(createBtn).toBeDisabled()
  })
})
