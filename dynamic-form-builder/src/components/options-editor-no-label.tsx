import { Input, Button } from "antd";
import type { Option } from "#/types/fields.ts";
import { slugify } from "#/lib/text-format";

type Props = {
  value: Option[];
  onChange: (next: Option[]) => void;
};

export function OptionsEditorNoLabel({ value, onChange }: Props) {
  const options = value ?? [];

  // Append _2, _3, ... only if this value already exists on another option.
  const makeUniqueValue = (base: string, index: number) => {
    if (!base) return "";
    const existing = options
      .filter((_, i) => i !== index)
      .map((o) => o.value);

    let v = base;
    let n = 2;
    while (existing.includes(v)) {
      v = `${base}_${n++}`;
    }
    return v;
  };

  // Type the label -> value is derived from it (slugified + made unique).
  const handleLabel = (i: number, label: string) =>
    onChange(
      options.map((o, idx) =>
        idx === i
          ? { label, value: makeUniqueValue(slugify(label), i) }
          : o,
      ),
    );

  // An option is blank until it has a usable value.
  const hasBlankOption = options.some((o) => !o.value);

  const addOption = () => {
    if (hasBlankOption) return; // don't stack empty rows
    onChange([...options, { label: "", value: "" }]);
  };

  const removeAt = (i: number) =>
    onChange(options.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= options.length) return;
    const next = [...options];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {options.length === 0 && (
        <p className="text-neutral-500">No options yet — add one below.</p>
      )}

      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Option label"
            value={opt.label}
            onChange={(e) => handleLabel(i, e.target.value)}
            className="flex-1"
          />

          {/* value is derived from the label; shown read-only for reference */}
          <p className="w-40 truncate text-xs text-neutral-500">
            {opt.value || "—"}
          </p>

          <Button size="small" onClick={() => move(i, -1)} disabled={i === 0}>
            ↑
          </Button>
          <Button
            size="small"
            onClick={() => move(i, 1)}
            disabled={i === options.length - 1}
          >
            ↓
          </Button>
          <Button size="small" danger onClick={() => removeAt(i)}>
            ✕
          </Button>
        </div>
      ))}

      <Button
        type="dashed"
        onClick={addOption}
        disabled={hasBlankOption}
        className="mt-1"
      >
        + Add option
      </Button>
      {hasBlankOption && (
        <p className="text-xs text-neutral-500">
          Fill in the current option before adding another.
        </p>
      )}
    </div>
  );
}