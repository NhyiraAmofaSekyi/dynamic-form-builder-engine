import { Input, Switch, InputNumber, Form, Collapse } from "antd";
import { useState } from "react";
import type { MultiSelectFieldBuilder, Option } from "#/types/fields.ts";
import {OptionsEditorNoLabel} from "#/components/options-editor-no-label.tsx";
import {CommonFieldSettings} from "#/components/common-fields.tsx";


function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type Props = {
  value: MultiSelectFieldBuilder;
  onChange: (next: MultiSelectFieldBuilder) => void;
};

// Multi-choice. Stored value is an array of option values; min/max bound how
// many may be picked (the array-cardinality version of "required").
export function MultiSelectFieldBuilderEditor({ value, onChange }: Props) {
  const update = (patch: Partial<MultiSelectFieldBuilder>) =>
    onChange({ ...value, ...patch });

  const handleLabel = (label: string) =>
    update({ label, name: slugify(label) || value.name });

  const setOptions = (options: Option[]) => update({ options });

  const limitsInvalid =
    value.minItems != null &&
    value.maxItems != null &&
    value.minItems > value.maxItems;

  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <Form layout="vertical" requiredMark={false}>
      <Form.Item label="Question / label" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Add a question or title"
            value={value.label}
            onChange={(e) => handleLabel(e.target.value)}
            className="flex-1"
          />
          <span className="flex items-center gap-2 whitespace-nowrap">
            <p className="text-neutral-500">Required</p>
            <Switch
              checked={value.required}
              onChange={(checked) => update({ required: checked })}
            />
          </span>
        </div>
      </Form.Item>

      <Form.Item label="Options" style={{ marginBottom: 12 }}>
        <OptionsEditorNoLabel value={value.options} onChange={setOptions} />
      </Form.Item>

      <CommonFieldSettings value={value} update={update} />

      <Collapse
        ghost
        activeKey={advancedOpen ? ["advanced"] : []}
        onChange={(keys) =>
          setAdvancedOpen((keys as string[]).includes("advanced"))
        }
        items={[
          {
            key: "advanced",
            label: <p className={"text-neutral-500"}>Advanced</p>,
            children: (
              <Form.Item
                label="Selection limits"
                validateStatus={limitsInvalid ? "error" : undefined}
                help={
                  limitsInvalid
                    ? "Minimum can't be greater than maximum."
                    : undefined
                }
                style={{ marginBottom: 0 }}
              >
                <div className="flex gap-3">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="Min choices"
                    value={value.minItems}
                    onChange={(v) => update({ minItems: v ?? undefined })}
                  />
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="Max choices"
                    value={value.maxItems}
                    onChange={(v) => update({ maxItems: v ?? undefined })}
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