import type { FieldValue, Response } from "#/types/schema.ts";

// snake_case key -> "Title Case" label (used when no schema label is available)
function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

//TODO:VALIDATE
// Format any FieldValue for read-only display.
function formatValue(v: FieldValue | undefined): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

type Props = {
  responses: Response[];
  // Field order to walk. Falls back to the union of keys across responses.
  order?: string[];
};

export function ResponseView({ responses, order }: Props) {
  if (responses.length === 0) {
    return <p className="text-sm text-neutral-400">No responses yet.</p>;
  }

  const keys =
    order ?? Array.from(new Set(responses.flatMap((r) => Object.keys(r))));

  return (
    <div className="flex flex-col gap-4">
      {responses.map((res, i) => (
        <div key={i} className="rounded-lg  border-gray-100 bg-white p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Response {i + 1}
          </p>
          <dl className="flex flex-col gap-2">
            {keys.map((key) => (
              <div key={key} className="grid grid-cols-3 gap-2">
                <dt className="col-span-1 text-sm text-gray-500">
                  {humanize(key)}
                </dt>
                <dd className="col-span-2 text-sm text-gray-900">
                  {formatValue(res[key])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}