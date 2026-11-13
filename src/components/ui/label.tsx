"use client";

import { Label as FlowbiteLabel } from "flowbite-react";
import type { ComponentProps } from "react";

export type LabelProps = ComponentProps<typeof FlowbiteLabel>;

export function Label({ className, ...props }: LabelProps) {
  return <FlowbiteLabel className={className} {...props} />;
}
