"use client";

import { Avatar as FlowbiteAvatar } from "flowbite-react";
import type { ComponentProps } from "react";

export type AvatarProps = ComponentProps<typeof FlowbiteAvatar>;

export function Avatar(props: AvatarProps) {
  return <FlowbiteAvatar {...props} />;
}
