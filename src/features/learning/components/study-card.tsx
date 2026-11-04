import { z } from "zod";
const schema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  caption: z.string().optional(),
  diagram: z.array(z.string()).optional(),
});
export function StudyCard({
  text,
  kind,
  mediaUrl,
}: {
  text: string;
  kind?: string;
  mediaUrl?: string | null;
}) {
  if (kind !== "STUDY_CARD") return <p className="lesson-text">{text}</p>;
  let parsed;
  try {
    parsed = schema.safeParse(JSON.parse(text));
  } catch {
    return <p className="lesson-text">{text}</p>;
  }
  if (!parsed.success) return <p className="lesson-text">{text}</p>;
  const card = parsed.data;
  return (
    <article className="study-card">
      <h2>{card.title}</h2>
      {card.paragraphs.map((paragraph, i) => (
        <p className="lesson-text" key={i}>
          {paragraph}
        </p>
      ))}
      {mediaUrl && /^\/(?!\/)/.test(mediaUrl) && (
        <img src={mediaUrl} alt={card.title} className="study-image" />
      )}
      {card.diagram && !mediaUrl && (
        <ol className="study-diagram" aria-label="Schematische Darstellung">
          {card.diagram.map((label, i) => (
            <li key={i}>{label}</li>
          ))}
        </ol>
      )}
      {card.caption && <p className="muted small">{card.caption}</p>}
    </article>
  );
}
