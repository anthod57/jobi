"use client";

import { Tooltip as FlowbiteTooltip } from "flowbite-react";
import type { ComponentProps } from "react";

export type TooltipProps = ComponentProps<typeof FlowbiteTooltip>;

export function Tooltip(props: TooltipProps) {
  return <FlowbiteTooltip {...props} />;
}
