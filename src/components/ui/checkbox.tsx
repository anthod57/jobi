"use client";

import { Checkbox as FlowbiteCheckbox } from "flowbite-react";
import type { ComponentProps } from "react";

export type CheckboxProps = ComponentProps<typeof FlowbiteCheckbox>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return <FlowbiteCheckbox className={className} {...props} />;
}
