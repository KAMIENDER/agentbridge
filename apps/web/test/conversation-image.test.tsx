import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UnifiedItem } from "@agentbridge/unified-surface";
import { ConversationItem } from "../src/components/ConversationItem";

vi.mock("@/lib/api", () => ({
  fetchLocalImageBlob: vi.fn(async () => new Blob(["image"], { type: "image/png" })),
}));

function renderItem(item: UnifiedItem) {
  return render(
    <ConversationItem
      item={item}
      isLast={false}
      turnIsInProgress={false}
      onSelectThread={() => {}}
    />,
  );
}

describe("conversation images", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:local-image"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders image parts in user messages", () => {
    renderItem({
      id: "user-1",
      type: "userMessage",
      content: [
        {
          type: "text",
          text: "Please inspect this",
        },
        {
          type: "image",
          url: "https://example.com/screenshot.png",
        },
      ],
    });

    expect(screen.getByText("Please inspect this")).toBeTruthy();
    const image = screen.getByRole("img", { name: "Attached image 1" });
    expect(image.getAttribute("src")).toBe("https://example.com/screenshot.png");
  });

  it("renders local image parts through Blob URLs", async () => {
    renderItem({
      id: "user-2",
      type: "userMessage",
      content: [
        {
          type: "localImage",
          path: "/tmp/example.png",
        },
      ],
    });

    await waitFor(() => {
      const image = screen.getByRole("img", { name: "Attached image 1" });
      expect(image.getAttribute("src")).toBe("blob:local-image");
    });
  });

  it("renders image outputs from dynamic tools", () => {
    renderItem({
      id: "tool-1",
      type: "dynamicToolCall",
      tool: "imagegen",
      arguments: {
        prompt: "draw a chart",
      },
      status: "completed",
      contentItems: [
        {
          type: "inputImage",
          imageUrl: "https://example.com/chart.webp",
        },
      ],
    });

    const image = screen.getByRole("img", { name: "Tool output image 1" });
    expect(image.getAttribute("src")).toBe("https://example.com/chart.webp");
  });

  it("renders view image events", async () => {
    renderItem({
      id: "image-view-1",
      type: "imageView",
      path: "/tmp/viewed.png",
    });

    await waitFor(() => {
      const image = screen.getByRole("img", { name: "Viewed image" });
      expect(image.getAttribute("src")).toBe("blob:local-image");
    });
    expect(screen.getByText("/tmp/viewed.png")).toBeTruthy();
  });
});
