import { Input, Switch, InputNumber, Form, Collapse } from "antd";
import { useState } from "react";
import type { TextFieldBuilder } from "#/types/fields.ts";
import { slugify } from "#/lib/text-format";
import {CommonFieldSettings} from "#/components/common-fields.tsx";

type Props = {
  value: TextFieldBuilder;
  onChange: (next: TextFieldBuilder) => void;
};

export function TextFieldBuilderEditor({ value, onChange }: Props) {
  const update = (patch: Partial<TextFieldBuilder>) =>
    onChange({ ...value, ...patch });

  // Label drives the key automatically; the key is never shown to the user.
  const handleLabel = (label: string) => {
    const trimmed = label.trim();
    const name = trimmed === "" ? "" : slugify(label) || value.name;
    update({ label, name });
  };

  const lengthInvalid =
    value.minLength != null &&
    value.maxLength != null &&
    value.minLength > value.maxLength;

  // Open Advanced if it already holds values (e.g. editing an existing field),
  // otherwise start collapsed.
  const hasAdvanced = value.minLength != null || value.maxLength != null;
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

      {/* Long answer toggle: off = single-line text, on = multi-line textarea */}
      <Form.Item style={{ marginBottom: 12 }}>
        <div className="flex items-center justify-between">
          <div>
            <p>Long answer</p>
            <div>
              <p  className="text-xs">
                Use a multi-line text area instead of a single line
              </p>
            </div>
          </div>
          <Switch
            checked={value.type === "textarea"}
            onChange={(checked) => update({ type: checked ? "textarea" : "text" })}
          />
        </div>
      </Form.Item>

      <CommonFieldSettings value={value} update={update} />

      {/* Advanced: character limits, hidden until expanded */}
      <Collapse
        ghost
        activeKey={advancedOpen ? ["advanced"] : []}
        onChange={(keys) => setAdvancedOpen((keys as string[]).includes("advanced"))}
        items={[
          {
            key: "advanced",
            label: <p >Advanced</p>,
            children: (
              <Form.Item
                label="Character limits"
                validateStatus={lengthInvalid ? "error" : undefined}
                help={
                  lengthInvalid
                    ? "Minimum can't be greater than maximum."
                    : undefined
                }
                style={{ marginBottom: 0 }}
              >
                <div className="flex gap-3">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="Min"
                    value={value.minLength}
                    onChange={(v) => update({ minLength: v ?? undefined })}
                  />
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="Max"
                    value={value.maxLength}
                    onChange={(v) => update({ maxLength: v ?? undefined })}
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