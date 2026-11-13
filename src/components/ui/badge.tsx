"use client";

import { Badge as FlowbiteBadge } from "flowbite-react";
import type { ComponentProps } from "react";

export type BadgeProps = ComponentProps<typeof FlowbiteBadge>;

export function Badge({ className, ...props }: BadgeProps) {
  return <FlowbiteBadge className={className} {...props} />;
}
