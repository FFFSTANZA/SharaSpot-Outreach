"use client";

import { useEffect, useState } from "react";
import Dropdown, { DropdownOption } from "@/components/Dropdown";
import { getTemplates } from "@/lib/apis";
import type { EmailTemplate } from "@/types";

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await getTemplates();
        setTemplates(data || []);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const options: DropdownOption[] = templates.map((t) => ({
    label: t.name,
    value: t.id,
  }));

  const handleChange = (value: string) => {
    const template = templates.find((t) => t.id === value);
    if (template) {
      onSelect(template);
      // Reset after a short delay so the dropdown closes properly
      setTimeout(() => setSelected(""), 100);
    }
  };

  return (
    <Dropdown
      options={options}
      value={selected}
      onChange={handleChange}
      placeholder={isLoading ? "Loading templates..." : "Add template"}
      className="w-full"
      disabled={isLoading}
    />
  );
}
