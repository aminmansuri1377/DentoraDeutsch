import type { Prisma } from "@prisma/client";
import generatedSchema from "@/generated/panel-schema.json";
export const panelSchema = generatedSchema as unknown as Prisma.DMMF.Datamodel;
import { TRPCError } from "@trpc/server";
import { modelLabels, fieldLabels, modelGroup } from "@/features/panel/labels";
const secretNames = new Set([
  "sessionToken",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
]);
export function getModel(name: string) {
  const model = panelSchema.models.find((m) => m.name === name);
  if (!model)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unbekannte Tabelle.",
    });
  return model;
}
export function uniqueFields(name: string) {
  const model = getModel(name);
  const id = model.fields.find((f) => f.isId);
  return id
    ? [id.name]
    : (model.primaryKey?.fields ??
        model.uniqueFields[0] ?? [model.fields.find((f) => f.isUnique)!.name]);
}
export function metadata(name: string) {
  const model = getModel(name),
    keys = uniqueFields(name);
  return {
    name,
    label: modelLabels[name] ?? name,
    group: modelGroup(name),
    keys,
    fields: model.fields
      .filter((f) => f.kind !== "object")
      .map((f) => {
        const relation = model.fields.find(
          (r) => r.kind === "object" && r.relationFromFields?.includes(f.name),
        );
        return {
          name: f.name,
          label: fieldLabels[f.name] ?? f.name,
          type: f.type,
          kind: f.kind,
          required: f.isRequired,
          hasDefault: f.hasDefaultValue,
          defaultValue: typeof f.default !== "object" ? f.default : undefined,
          readonly: f.isUpdatedAt,
          primary: keys.includes(f.name),
          secret: secretNames.has(f.name),
          relation: relation?.type,
          options:
            f.kind === "enum"
              ? panelSchema.enums
                  .find((e) => e.name === f.type)
                  ?.values.map((v) => v.name)
              : undefined,
        };
      }),
  };
}
export function allMetadata() {
  return panelSchema.models.map((m) => metadata(m.name));
}
export function uniqueWhere(name: string, row: Record<string, unknown>) {
  const fields = uniqueFields(name);
  if (fields.length === 1) return { [fields[0]]: row[fields[0]] };
  return {
    [fields.join("_")]: Object.fromEntries(
      fields.map((key) => [key, row[key]]),
    ),
  };
}
export function validateFields(
  name: string,
  input: Record<string, unknown>,
  editing: boolean,
) {
  const meta = metadata(name);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const field = meta.fields.find((f) => f.name === key);
    if (!field || field.readonly || (editing && field.primary))
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Feld nicht bearbeitbar: ${key}`,
      });
    if (value === null) {
      if (field.required)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} ist erforderlich.`,
        });
      result[key] = null;
      continue;
    }
    if (field.kind === "enum") {
      if (typeof value !== "string" || !field.options?.includes(value))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Ungültiger Wert für ${field.label}.`,
        });
      result[key] = value;
      continue;
    }
    switch (field.type) {
      case "String":
        if (typeof value !== "string" || value.length > 50000)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Ungültiger Text: ${field.label}`,
          });
        result[key] = value;
        break;
      case "Int":
        if (
          typeof value !== "number" ||
          !Number.isInteger(value) ||
          value < -2147483648 ||
          value > 2147483647
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Ganze Zahl erforderlich: ${field.label}`,
          });
        result[key] = value;
        break;
      case "Boolean":
        if (typeof value !== "boolean")
          throw new TRPCError({ code: "BAD_REQUEST" });
        result[key] = value;
        break;
      case "DateTime":
        if (typeof value !== "string" || Number.isNaN(Date.parse(value)))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Ungültiges Datum: ${field.label}`,
          });
        result[key] = new Date(value);
        break;
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nicht unterstützter Feldtyp.",
        });
    }
  }
  if (!editing)
    for (const field of meta.fields) {
      if (
        field.required &&
        !field.hasDefault &&
        !field.readonly &&
        !(field.name in result)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} ist erforderlich.`,
        });
    }
  return result;
}
