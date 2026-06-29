import { Input, Switch, DatePicker, Form, Collapse } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import type { DateFieldBuilder } from "#/types/fields.ts";
import { slugify } from "#/lib/text-format";
import { CommonFieldSettings } from "#/components/common-fields.tsx";

type Props = {
  value: DateFieldBuilder;
  onChange: (next: DateFieldBuilder) => void;
};

export function DateFieldBuilderEditor({ value, onChange }: Props) {
  const update = (patch: Partial<DateFieldBuilder>) =>
    onChange({ ...value, ...patch });

  const handleLabel = (label: string) => {
    const trimmed = label.trim();
    const name = trimmed === "" ? "" : slugify(label) || value.name;
    update({ label, name });
  };

  // minDate must not be after maxDate. Dates are stored as "YYYY-MM-DD" strings,
  // which compare correctly lexicographically — but we compare via dayjs to be safe.
  const rangeInvalid =
    value.minDate != null &&
    value.maxDate != null &&
    dayjs(value.minDate).isAfter(dayjs(value.maxDate));

  const hasAdvanced = value.minDate != null || value.maxDate != null;
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

      {/* Advanced: allowed date range, hidden until expanded */}
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
                label="Allowed date range"
                validateStatus={rangeInvalid ? "error" : undefined}
                help={
                  rangeInvalid
                    ? "Earliest date can't be after the latest date."
                    : undefined
                }
                style={{ marginBottom: 0 }}
              >
                <div className="flex gap-3">
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Earliest"
                    // store as "YYYY-MM-DD" string, parse back to dayjs for display
                    value={value.minDate ? dayjs(value.minDate) : undefined}
                    onChange={(d) =>
                      update({ minDate: d ? d.format("YYYY-MM-DD") : undefined })
                    }
                  />
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Latest"
                    value={value.maxDate ? dayjs(value.maxDate) : undefined}
                    onChange={(d) =>
                      update({ maxDate: d ? d.format("YYYY-MM-DD") : undefined })
                    }
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