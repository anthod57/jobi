"use client";

import { useId, useState } from "react";

import { Button, Card, Input, Label } from "@/components/ui";

type SkillsSectionProps = {
  skills: string[];
  onChange: (skills: string[]) => void;
};

export function SkillsSection({ skills, onChange }: SkillsSectionProps) {
  const inputId = useId();
  const [draft, setDraft] = useState("");

  const addSkill = () => {
    const label = draft.trim();
    if (!label || skills.includes(label)) {
      setDraft("");
      return;
    }
    onChange([...skills, label]);
    setDraft("");
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <Card title="Compétences" className="mt-section">
      <div className="flex flex-col gap-stack">
        <div>
          <Label htmlFor={inputId} value="Ajouter une compétence" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              id={inputId}
              className="min-w-[12rem] flex-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button type="button" color="gray" onClick={addSkill}>
              Ajouter
            </Button>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Compétences du profil">
          {skills.map((skill, index) => (
            <li key={`${skill}-${index}`}>
              <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-100 px-3 py-1 text-sm text-secondary-900 dark:bg-secondary-700 dark:text-white">
                {skill}
                <Button
                  type="button"
                  size="xs"
                  color="gray"
                  aria-label={`Retirer ${skill}`}
                  onClick={() => removeSkill(index)}
                >
                  ×
                </Button>
              </span>
            </li>
          ))}
          {skills.length === 0 ? (
            <li className="text-sm text-secondary-500">Aucune compétence.</li>
          ) : null}
        </ul>
      </div>
    </Card>
  );
}
