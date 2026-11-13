"use client";

import { Select as FlowbiteSelect } from "flowbite-react";
import type { ComponentProps } from "react";

export type SelectProps = ComponentProps<typeof FlowbiteSelect>;

export function Select({ className, ...props }: SelectProps) {
  return <FlowbiteSelect className={className} {...props} />;
}
