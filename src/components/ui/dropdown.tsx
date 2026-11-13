"use client";

import {
  Dropdown as FlowbiteDropdown,
  DropdownDivider as FlowbiteDropdownDivider,
  DropdownHeader as FlowbiteDropdownHeader,
  DropdownItem as FlowbiteDropdownItem,
} from "flowbite-react";
import type { ComponentProps } from "react";

export type DropdownProps = ComponentProps<typeof FlowbiteDropdown>;
export type DropdownItemProps = ComponentProps<typeof FlowbiteDropdownItem>;
export type DropdownHeaderProps = ComponentProps<typeof FlowbiteDropdownHeader>;
export type DropdownDividerProps = ComponentProps<typeof FlowbiteDropdownDivider>;

export function Dropdown(props: DropdownProps) {
  return <FlowbiteDropdown {...props} />;
}

export function DropdownItem(props: DropdownItemProps) {
  return <FlowbiteDropdownItem {...props} />;
}

export function DropdownHeader(props: DropdownHeaderProps) {
  return <FlowbiteDropdownHeader {...props} />;
}

export function DropdownDivider(props: DropdownDividerProps) {
  return <FlowbiteDropdownDivider {...props} />;
}
