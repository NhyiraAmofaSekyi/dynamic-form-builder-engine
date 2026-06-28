import { Input, Switch, Form } from "antd";
import type { BooleanFieldBuilder } from "#/types/fields.ts";
import { slugify } from "#/lib/text-format";
import { CommonFieldSettings } from "#/components/common-fields.tsx";

type Props = {
  value: BooleanFieldBuilder;
  onChange: (next: BooleanFieldBuilder) => void;
};

export function BooleanFieldBuilderEditor({ value, onChange }: Props) {
  const update = (patch: Partial<BooleanFieldBuilder>) =>
    onChange({ ...value, ...patch });

  const options = value["x-options"] ?? [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
  ];

  const updateOption = (index: number, label: string) => {
    const next = [...options];
    next[index] = { ...next[index], label };
    update({ "x-options": next });
  };

  const handleLabel = (label: string) => {
    const trimmed = label.trim();
    const name = trimmed === "" ? "" : slugify(label) || value.name;
    update({ label, name });
  };

  return (
    <Form layout="vertical" requiredMark={false}>
      {/* Label + required toggle */}
      <Form.Item label="Question / label" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Add a question or title"
            value={value.label}
            onChange={(e) => handleLabel(e.target.value)}
            className="flex-1"
          />

          <span className="flex items-center gap-2 whitespace-nowrap">
            <p className="text-sm text-neutral-500">Required</p>
            <Switch
              checked={value.required}
              onChange={(checked) => update({ required: checked })}
            />
          </span>
        </div>
      </Form.Item>

      {/* Boolean option labels (NOW USING x-options) */}
      <Form.Item label="Response labels" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Yes label"
            value={options[0]?.label ?? ""}
            onChange={(e) => updateOption(0, e.target.value)}
            className="flex-1"
          />

          <Input
            placeholder="No label"
            value={options[1]?.label ?? ""}
            onChange={(e) => updateOption(1, e.target.value)}
            className="flex-1"
          />
        </div>
      </Form.Item>

      <CommonFieldSettings value={value} update={update} />
    </Form>
  );
}