import { it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
const state = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/server/db", () => ({ db: { $transaction: state.transaction } }));
import { atomic } from "@/server/transaction";
it("allows remote multi-query work longer than the default five seconds", async () => {
  state.transaction.mockResolvedValueOnce("done");
  expect(await atomic(async () => "done")).toBe("done");
  expect(state.transaction).toHaveBeenLastCalledWith(expect.any(Function), {
    isolationLevel: "Serializable",
    timeout: 30000,
    maxWait: 10000,
  });
});
it("returns a retryable timeout for expired or closed transactions without replaying writes", async () => {
  for (const code of ["P2028", "P1017"]) {
    state.transaction.mockReset();
    state.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("internal", {
        code,
        clientVersion: "7.10.1",
      }),
    );
    await expect(atomic(async () => "done")).rejects.toMatchObject({
      code: "TIMEOUT",
    });
    expect(state.transaction).toHaveBeenCalledTimes(1);
  }
});
