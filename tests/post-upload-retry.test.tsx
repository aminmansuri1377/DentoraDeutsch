// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const state = vi.hoisted(() => ({
  upload: vi.fn(),
  publish: vi.fn(),
}));
vi.mock("@/trpc/provider", () => ({
  useTRPC: () => ({ social: { create: { mutationOptions: () => ({}) } } }),
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: state.publish, isPending: false, error: null }),
}));
vi.mock("@/features/community/use-social-refresh", () => ({
  useSocialRefresh: () => vi.fn(),
}));
vi.mock("@/features/media/use-image-upload", () => ({
  useImageUpload: () => ({
    mutateAsync: state.upload,
    isPending: false,
    isError: true,
    error: new Error("Upload fehlgeschlagen"),
    reset: vi.fn(),
  }),
}));
import { PostComposer } from "../src/features/community/components/post-composer";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("keeps text and the file after failure, blocks publication, and retries that file", async () => {
  state.upload
    .mockRejectedValueOnce(new Error("fetch failed"))
    .mockResolvedValueOnce({ id: "image-id", url: "/api/media/image-id" });
  const { container } = render(
    <PostComposer onClose={vi.fn()} onPublished={vi.fn()} />,
  );
  fireEvent.change(screen.getByLabelText("Dein Beitrag"), {
    target: { value: "Mein Beitrag" },
  });
  const file = new File(["image"], "post.webp", { type: "image/webp" });
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });
  await waitFor(() => expect(state.upload).toHaveBeenCalledOnce());
  const publish = screen.getByRole("button", {
    name: "Veröffentlichen",
  }) as HTMLButtonElement;
  expect(publish.disabled).toBe(true);
  fireEvent.submit(container.querySelector("form")!);
  expect(state.publish).not.toHaveBeenCalled();
  fireEvent.click(
    await screen.findByRole("button", { name: "Bildupload erneut versuchen" }),
  );
  await waitFor(() => expect(publish.disabled).toBe(false));
  expect(state.upload.mock.calls[1][0]).toBe(file);
  expect(
    (screen.getByLabelText("Dein Beitrag") as HTMLTextAreaElement).value,
  ).toBe("Mein Beitrag");
  fireEvent.submit(container.querySelector("form")!);
  expect(state.publish).toHaveBeenCalledWith({
    body: "Mein Beitrag",
    mediaId: "image-id",
  });
});
