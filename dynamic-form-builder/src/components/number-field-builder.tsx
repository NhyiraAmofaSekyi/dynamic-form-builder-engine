import { Input, Switch, InputNumber, Form, Collapse } from "antd";
import { useState } from "react";
import type { NumberFieldBuilder } from "#/types/fields.ts";
import { slugify } from "#/lib/text-format";
import { CommonFieldSettings } from "#/components/common-fields.tsx";

type Props = {
  value: NumberFieldBuilder;
  onChange: (next: NumberFieldBuilder) => void;
};

export function NumberFieldBuilderEditor({ value, onChange }: Props) {
  const update = (patch: Partial<NumberFieldBuilder>) =>
    onChange({ ...value, ...patch });

  // Label drives the key automatically; the key is never shown to the user.
  const handleLabel = (label: string) => {
    const trimmed = label.trim();
    const name = trimmed === "" ? "" : slugify(label) || value.name;
    update({ label, name });
  };

  // min must not exceed max (value range, not string length)
  const rangeInvalid =
    value.minimum != null &&
    value.maximum != null &&
    value.minimum > value.maximum;

  // Open Advanced if it already holds values (editing an existing field).
  const hasAdvanced = value.minimum != null || value.maximum != null;
  const [advancedOpen, setAdvancedOpen] = useState(hasAdvanced);

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
            <p className="font-lg text-neutral-500">Required</p>
            <Switch
              checked={value.required}
              onChange={(checked) => update({ required: checked })}
            />
          </span>
        </div>
      </Form.Item>

      <CommonFieldSettings value={value} update={update} />

      {/* Advanced: value range, hidden until expanded */}
      <Collapse
        ghost
        activeKey={advancedOpen ? ["advanced"] : []}
        onChange={(keys) => setAdvancedOpen((keys as string[]).includes("advanced"))}
        items={[
          {
            key: "advanced",
            label: <p>Advanced</p>,
            children: (
              <Form.Item
                label="Value range"
                validateStatus={rangeInvalid ? "error" : undefined}
                help={
                  rangeInvalid
                    ? "Minimum can't be greater than maximum."
                    : undefined
                }
                style={{ marginBottom: 0 }}
              >
                <div className="flex gap-3">
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Min"
                    value={value.minimum}
                    onChange={(v) => update({ minimum: v ?? undefined })}
                  />
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Max"
                    value={value.maximum}
                    onChange={(v) => update({ maximum: v ?? undefined })}
                  />
                </div>
              </Form.Item>
            ),
          },
        ]}
      />
    </Form>
  );
}