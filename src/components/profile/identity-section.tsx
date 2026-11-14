"use client";

import { Card, Input, Label } from "@/components/ui";
import type { ProfileUpdateInput } from "@/lib/profile/schemas";

type IdentitySectionProps = {
  value: Pick<
    ProfileUpdateInput,
    "fullName" | "headline" | "email" | "phone"
  >;
  onChange: (
    patch: Partial<
      Pick<ProfileUpdateInput, "fullName" | "headline" | "email" | "phone">
    >,
  ) => void;
};

export function IdentitySection({ value, onChange }: IdentitySectionProps) {
  return (
    <Card title="Identité & contact" className="mt-section">
      <div className="flex flex-col gap-stack">
        <div>
          <Label
            htmlFor="profile-fullName"
            value="Nom complet"
            className="mb-1.5 block"
          />
          <Input
            id="profile-fullName"
            value={value.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            autoComplete="name"
          />
        </div>
        <div>
          <Label
            htmlFor="profile-headline"
            value="Titre professionnel"
            className="mb-1.5 block"
          />
          <Input
            id="profile-headline"
            value={value.headline}
            onChange={(e) => onChange({ headline: e.target.value })}
          />
        </div>
        <div className="grid gap-stack sm:grid-cols-2">
          <div>
            <Label
              htmlFor="profile-email"
              value="E-mail"
              className="mb-1.5 block"
            />
            <Input
              id="profile-email"
              type="email"
              value={value.email}
              onChange={(e) => onChange({ email: e.target.value })}
              autoComplete="email"
            />
          </div>
          <div>
            <Label
              htmlFor="profile-phone"
              value="Téléphone"
              className="mb-1.5 block"
            />
            <Input
              id="profile-phone"
              type="tel"
              value={value.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              autoComplete="tel"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
