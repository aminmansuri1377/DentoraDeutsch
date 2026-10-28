import { z } from "zod";
const httpsUrl = z
  .url()
  .refine((url) => url.startsWith("https://"), "HTTPS erforderlich");
export const courseImportSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/),
  title: z.string().min(3).max(150),
  description: z.string().max(2000),
  specialtyId: z.string(),
  access: z.enum(["FREE", "PRO", "PURCHASE"]),
  chapters: z
    .array(
      z.object({
        title: z.string().min(3).max(150),
        guide: z.string().max(5000).default(""),
        lessons: z
          .array(
            z.object({
              slug: z.string().regex(/^[a-z0-9-]{3,100}$/),
              title: z.string().min(3).max(150),
              estimatedMinutes: z.number().int().min(1).max(60),
              freePreview: z.boolean(),
              blocks: z
                .array(
                  z.object({
                    text: z.string().min(1).max(20000),
                    sourceUrl: httpsUrl.optional(),
                  }),
                )
                .min(1)
                .max(30),
              questions: z
                .array(
                  z.object({
                    prompt: z.string().min(3).max(2000),
                    explanation: z.string().min(3).max(5000),
                    hint: z.string().max(1000).optional(),
                    kind: z.enum(["SINGLE_CHOICE", "TRUE_FALSE"]),
                    options: z
                      .array(
                        z.object({
                          text: z.string().min(1).max(1000),
                          isCorrect: z.boolean(),
                        }),
                      )
                      .min(2)
                      .max(6)
                      .refine(
                        (options) =>
                          options.filter((o) => o.isCorrect).length === 1,
                        "Genau eine richtige Antwort erforderlich",
                      ),
                  }),
                )
                .min(1)
                .max(30),
            }),
          )
          .min(1)
          .max(30),
      }),
    )
    .min(1)
    .max(40),
});
