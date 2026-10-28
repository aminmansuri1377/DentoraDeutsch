import { z } from "zod";
import { router, panelProcedure } from "../trpc";
import { allMetadata } from "../panel/registry";
import {
  listRecords,
  saveRecord,
  deleteRecord,
  relationOptions,
  deletionImpact,
} from "../panel/service";
const target = z.object({ model: z.string().max(60) });
export const panelRouter = router({
  metadata: panelProcedure.query(() => allMetadata()),
  list: panelProcedure
    .input(
      target.extend({
        page: z.number().int().min(0).max(100000).default(0),
        search: z.string().max(150).default(""),
      }),
    )
    .query(({ input }) => listRecords(input.model, input.page, input.search)),
  save: panelProcedure
    .input(
      target.extend({
        key: z.string().max(3000).optional(),
        data: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(({ ctx, input }) =>
      saveRecord(input.model, input.key, input.data, ctx.panel.actorId),
    ),
  remove: panelProcedure
    .input(
      target.extend({
        key: z.string().max(3000),
        confirmation: z.literal("LÖSCHEN"),
      }),
    )
    .mutation(({ ctx, input }) =>
      deleteRecord(input.model, input.key, ctx.panel.actorId),
    ),
  impact: panelProcedure
    .input(target.extend({ key: z.string().max(3000) }))
    .query(({ input }) => deletionImpact(input.model, input.key)),
  options: panelProcedure
    .input(target.extend({ search: z.string().max(100).default("") }))
    .query(({ input }) => relationOptions(input.model, input.search)),
});
