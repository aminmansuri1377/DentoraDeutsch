import { touchContent } from "./content-integrity";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { db } from "../db";
import {
  panelSchema,
  getModel,
  metadata,
  uniqueWhere,
  validateFields,
} from "./registry";
import { seal, unseal } from "./crypto";
type Row = Record<string, unknown>;
interface Delegate {
  findMany(args: Record<string, unknown>): Promise<Row[]>;
  count(args?: Record<string, unknown>): Promise<number>;
  findUnique(args: Record<string, unknown>): Promise<Row | null>;
  create(args: Record<string, unknown>): Promise<Row>;
  update(args: Record<string, unknown>): Promise<Row>;
  delete(args: Record<string, unknown>): Promise<Row>;
}
function delegate(client: unknown, name: string) {
  getModel(name);
  return (client as Record<string, Delegate>)[
    name[0].toLowerCase() + name.slice(1)
  ];
}
function recordKey(model: string, row: Row) {
  return seal({
    purpose: "panel-record",
    model,
    where: uniqueWhere(model, row),
  });
}
function decodeKey(model: string, key: string) {
  const decoded = unseal<{ purpose: string; model: string; where: Row }>(key);
  if (!decoded || decoded.purpose !== "panel-record" || decoded.model !== model)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Ungültiger Datensatz.",
    });
  return decoded.where;
}
function publicRow(model: string, row: Row) {
  const meta = metadata(model);
  return {
    key: recordKey(model, row),
    values: Object.fromEntries(
      meta.fields.map((f) => [f.name, f.secret ? null : row[f.name]]),
    ),
  };
}
function mapError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      throw new TRPCError({
        code: "CONFLICT",
        message: "Dieser Wert ist bereits vorhanden.",
      });
    if (error.code === "P2003")
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Verknüpfung ungültig oder Datensatz wird noch verwendet.",
      });
    if (error.code === "P2025")
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Der Datensatz wurde nicht gefunden.",
      });
  }
  throw error;
}
export async function listRecords(model: string, page: number, search: string) {
  const meta = metadata(model);
  const strings = meta.fields.filter((f) => f.type === "String" && !f.secret);
  const where =
    search && strings.length
      ? {
          OR: strings.map((f) => ({
            [f.name]: { contains: search, mode: "insensitive" },
          })),
        }
      : {};
  const d = delegate(db, model);
  const order = meta.fields.some((f) => f.name === "createdAt")
    ? "createdAt"
    : meta.keys[0];
  const [rows, total] = await Promise.all([
    d.findMany({
      where,
      orderBy: { [order]: "desc" },
      skip: page * 20,
      take: 20,
    }),
    d.count({ where }),
  ]);
  return {
    rows: rows.map((row) => publicRow(model, row)),
    total,
    pages: Math.ceil(total / 20),
  };
}
export async function saveRecord(
  model: string,
  key: string | undefined,
  data: Row,
  actorId: string | null,
) {
  const values = validateFields(model, data, !!key);
  try {
    return await db.$transaction(async (tx) => {
      const d = delegate(tx, model);
      const row = key
        ? await d.update({ where: decodeKey(model, key), data: values })
        : await d.create({ data: values });
      await touchContent(tx, model, row);
      await tx.auditLog.create({
        data: {
          actorId,
          action: `PANEL_${key ? "UPDATE" : "CREATE"}:${model}`,
          entityId: typeof row.id === "string" ? row.id : null,
        },
      });
      return publicRow(model, row);
    });
  } catch (error) {
    mapError(error);
  }
}
export async function deleteRecord(
  model: string,
  key: string,
  actorId: string | null,
) {
  try {
    return await db.$transaction(async (tx) => {
      const row = await delegate(tx, model).delete({
        where: decodeKey(model, key),
      });
      await touchContent(tx, model, row, true);
      await tx.auditLog.create({
        data: {
          actorId: model === "User" && row.id === actorId ? null : actorId,
          action: `PANEL_DELETE:${model}`,
          entityId: typeof row.id === "string" ? row.id : null,
        },
      });
      return { deleted: true };
    });
  } catch (error) {
    mapError(error);
  }
}
export async function relationOptions(model: string, search: string) {
  const meta = metadata(model);
  const labelField =
    ["title", "name", "email", "slug", "text", "prompt", "subject"].find((n) =>
      meta.fields.some((f) => f.name === n),
    ) ?? meta.keys[0];
  const rows = await delegate(db, model).findMany({
    where: search
      ? { [labelField]: { contains: search, mode: "insensitive" } }
      : {},
    take: 30,
    orderBy: { [labelField]: "asc" },
  });
  return rows.map((row) => ({
    value: String(row.id ?? row[meta.keys[0]]),
    label: String(row[labelField] ?? row.id),
  }));
}
export async function deletionImpact(model: string, key: string) {
  const row = await delegate(db, model).findUnique({
    where: decodeKey(model, key),
  });
  if (!row) throw new TRPCError({ code: "NOT_FOUND" });
  const impacts = [];
  for (const m of panelSchema.models) {
    for (const f of m.fields.filter(
      (f) =>
        f.kind === "object" && f.type === model && f.relationFromFields?.length,
    )) {
      const where = Object.fromEntries(
        f.relationFromFields!.map((name, i) => [
          name,
          row[f.relationToFields![i]],
        ]),
      );
      const count = await delegate(db, m.name).count({ where });
      if (count)
        impacts.push({
          model: m.name,
          label: metadata(m.name).label,
          count,
          behavior: f.relationOnDelete ?? "Restrict",
        });
    }
  }
  return impacts;
}
