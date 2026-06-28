import type { BaseFieldBuilder } from "#/types/fields";
import { Form, Input } from "antd";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

export function CommonFieldSettings({
                                      value,
                                      update,
                                    }: {
  value: BaseFieldBuilder;
  update: (patch: Partial<BaseFieldBuilder>) => void;
}) {
  const [showPlaceholder, setShowPlaceholder] = useState(!!value.placeholder);
  const [showHelp, setShowHelp] = useState(!!value.description);

  return (
    <div className="flex flex-col gap-2">
      {/* Chips row */}
      <div className="flex items-center gap-2 flex-wrap">
        {!showPlaceholder ? (
          <div
            onClick={() => setShowPlaceholder(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 p-2 w-fit"
          >
            <PlusIcon size={15} />
            <p>Add placeholder</p>
          </div>
        ) : null}

        {!showHelp ? (
          <div
            onClick={() => setShowHelp(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 p-2 w-fit"
          >
            <PlusIcon size={15} />
            <p>Add help text</p>
          </div>
        ) : null}
      </div>

      {/* Forms column */}
      <div className="flex flex-col gap-3">
        {showPlaceholder && (
          <Form.Item label="Placeholder (optional)" style={{ marginBottom: 0 }}>
            <Input
              placeholder="Shown inside the empty field"
              value={value.placeholder}
              onChange={(e) => update({ placeholder: e.target.value })}
            />
          </Form.Item>
        )}

        {showHelp && (
          <Form.Item label="Help text (optional)" style={{ marginBottom: 0 }}>
            <Input
              placeholder="Shown beneath the field"
              value={value.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Form.Item>
        )}
      </div>
    </div>
  );
}