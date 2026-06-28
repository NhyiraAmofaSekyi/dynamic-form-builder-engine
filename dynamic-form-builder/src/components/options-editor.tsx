import { Input, Button, Typography } from "antd";
import type { Option } from "#/types/fields.ts";

const { Text } = Typography;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type Props = {
  value: Option[];
  onChange: (next: Option[]) => void;
};

export function OptionsEditor({ value, onChange }: Props) {
  const options = value ?? [];

  const updateAt = (i: number, patch: Partial<Option>) =>
    onChange(
      options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );

  const makeUniqueValue = (base: string, index: number) => {
    if (!base) return "";

    const existing = options
      .filter((_, i) => i !== index)
      .map((o) => o.value);

    let value = base;
    let counter = 1;

    while (existing.includes(value)) {
      value = `${base}_${counter++}`;
    }

    return value;
  };

  const handleLabel = (i: number, label: string) => {
    const patch: Partial<Option> = {
      label,
    };

    // Only auto-fill if value is currently empty.
    // Don't overwrite a value the user has edited manually.
    if (!options[i].value) {
      patch.value = makeUniqueValue(slugify(label), i);
    }

    updateAt(i, patch);
  };

  const addOption = () =>
    onChange([
      ...options,
      {
        label: "",
        value: "",
      },
    ]);

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
        <Text type="secondary">
          No options yet — add one below.
        </Text>
      )}

      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Option label"
            value={opt.label}
            onChange={(e) => handleLabel(i, e.target.value)}
            className="flex-1"
          />

          <Input
            placeholder="Value"
            value={opt.value}
            onChange={(e) =>
              updateAt(i, {
                value: makeUniqueValue(slugify(e.target.value), i),
              })
            }
            style={{ width: 160 }}
          />

          <Button
            size="small"
            onClick={() => move(i, -1)}
            disabled={i === 0}
          >
            ↑
          </Button>

          <Button
            size="small"
            onClick={() => move(i, 1)}
            disabled={i === options.length - 1}
          >
            ↓
          </Button>

          <Button
            size="small"
            danger
            onClick={() => removeAt(i)}
          >
            ✕
          </Button>
        </div>
      ))}

      <Button
        type="dashed"
        onClick={addOption}
        className="mt-1"
      >
        + Add option
      </Button>
    </div>
  );
}