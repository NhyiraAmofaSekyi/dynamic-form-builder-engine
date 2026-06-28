import { Input, Switch, Form } from "antd";
import type { SelectFieldBuilder, Option } from "#/types/fields.ts";
import { slugify } from "#/lib/text-format";
import {OptionsEditorNoLabel} from "#/components/options-editor-no-label.tsx";
import {CommonFieldSettings} from "#/components/common-fields.tsx";

type Props = {
  value: SelectFieldBuilder;
  onChange: (next: SelectFieldBuilder) => void;
};

// Single-choice dropdown. Stored value is one of the option values (enum).
export function SelectFieldBuilderEditor({ value, onChange }: Props) {
  const update = (patch: Partial<SelectFieldBuilder>) =>
    onChange({ ...value, ...patch });

  const handleLabel = (label: string) =>
    update({ label, name: slugify(label) || value.name });

  const setOptions = (options: Option[]) => update({ options });

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
            <p className="font-lg text-neutral-500">Required</p>
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
    </Form>
  );
}