"use client";

import { Label as FlowbiteLabel } from "flowbite-react";
import type { ComponentProps, ReactNode } from "react";

export type LabelProps = Omit<ComponentProps<typeof FlowbiteLabel>, "children"> & {
  /** Visible label text (Contract alias for children). */
  value?: string;
  children?: ReactNode;
};

export function Label({ value, children, className, ...props }: LabelProps) {
  return (
    <FlowbiteLabel className={className} {...props}>
      {children ?? value}
    </FlowbiteLabel>
  );
}
