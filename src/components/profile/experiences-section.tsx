"use client";

import { Button, Card, Input, Label } from "@/components/ui";
import type { ProfileUpdateInput } from "@/lib/profile/schemas";

type ExperienceRow = ProfileUpdateInput["experiences"][number];

type ExperiencesSectionProps = {
  experiences: ExperienceRow[];
  onChange: (experiences: ExperienceRow[]) => void;
};

function emptyExperience(sortOrder: number): ExperienceRow {
  return {
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: null,
    description: "",
    sortOrder,
  };
}

export function ExperiencesSection({
  experiences,
  onChange,
}: ExperiencesSectionProps) {
  const updateRow = (index: number, patch: Partial<ExperienceRow>) => {
    onChange(
      experiences.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => {
    onChange([...experiences, emptyExperience(experiences.length)]);
  };

  const removeRow = (index: number) => {
    onChange(
      experiences
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, sortOrder: i })),
    );
  };

  return (
    <Card title="Expériences" className="mt-section">
      <div className="flex flex-col gap-stack">
        {experiences.map((row, index) => {
          const prefix = `profile-exp-${index}`;
          return (
            <div
              key={prefix}
              className="flex flex-col gap-stack rounded-lg border border-secondary-200 p-4 dark:border-secondary-700"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-medium text-secondary-900 dark:text-white">
                  Expérience {index + 1}
                </h3>
                <Button
                  type="button"
                  size="xs"
                  color="gray"
                  onClick={() => removeRow(index)}
                >
                  Retirer
                </Button>
              </div>
              <div>
                <Label
                  htmlFor={`${prefix}-title`}
                  value="Intitulé du poste"
                  className="mb-1.5 block"
                />
                <Input
                  id={`${prefix}-title`}
                  value={row.title}
                  onChange={(e) => updateRow(index, { title: e.target.value })}
                />
              </div>
              <div className="grid gap-stack sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor={`${prefix}-company`}
                    value="Entreprise"
                    className="mb-1.5 block"
                  />
                  <Input
                    id={`${prefix}-company`}
                    value={row.company}
                    onChange={(e) =>
                      updateRow(index, { company: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`${prefix}-location`}
                    value="Lieu"
                    className="mb-1.5 block"
                  />
                  <Input
                    id={`${prefix}-location`}
                    value={row.location}
                    onChange={(e) =>
                      updateRow(index, { location: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-stack sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor={`${prefix}-start`}
                    value="Date de début"
                    className="mb-1.5 block"
                  />
                  <Input
                    id={`${prefix}-start`}
                    type="date"
                    value={row.startDate}
                    onChange={(e) =>
                      updateRow(index, { startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`${prefix}-end`}
                    value="Date de fin"
                    className="mb-1.5 block"
                  />
                  <Input
                    id={`${prefix}-end`}
                    type="date"
                    value={row.endDate ?? ""}
                    onChange={(e) =>
                      updateRow(index, {
                        endDate: e.target.value === "" ? null : e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor={`${prefix}-desc`}
                  value="Description"
                  className="mb-1.5 block"
                />
                <Input
                  id={`${prefix}-desc`}
                  value={row.description}
                  onChange={(e) =>
                    updateRow(index, { description: e.target.value })
                  }
                />
              </div>
            </div>
          );
        })}
        <Button type="button" color="gray" onClick={addRow}>
          Ajouter une expérience
        </Button>
      </div>
    </Card>
  );
}
