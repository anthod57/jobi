"use client";

import {
  Sidebar as FlowbiteSidebar,
  SidebarCollapse as FlowbiteSidebarCollapse,
  SidebarItem as FlowbiteSidebarItem,
  SidebarItemGroup as FlowbiteSidebarItemGroup,
  SidebarItems as FlowbiteSidebarItems,
  SidebarLogo as FlowbiteSidebarLogo,
} from "flowbite-react";
import type { ComponentProps } from "react";

export type SidebarProps = ComponentProps<typeof FlowbiteSidebar>;
export type SidebarItemsProps = ComponentProps<typeof FlowbiteSidebarItems>;
export type SidebarItemGroupProps = ComponentProps<typeof FlowbiteSidebarItemGroup>;
export type SidebarItemProps = ComponentProps<typeof FlowbiteSidebarItem>;
export type SidebarLogoProps = ComponentProps<typeof FlowbiteSidebarLogo>;
export type SidebarCollapseProps = ComponentProps<typeof FlowbiteSidebarCollapse>;

export function Sidebar(props: SidebarProps) {
  return <FlowbiteSidebar {...props} />;
}

export function SidebarItems(props: SidebarItemsProps) {
  return <FlowbiteSidebarItems {...props} />;
}

export function SidebarItemGroup(props: SidebarItemGroupProps) {
  return <FlowbiteSidebarItemGroup {...props} />;
}

export function SidebarItem(props: SidebarItemProps) {
  return <FlowbiteSidebarItem {...props} />;
}

export function SidebarLogo(props: SidebarLogoProps) {
  return <FlowbiteSidebarLogo {...props} />;
}

export function SidebarCollapse(props: SidebarCollapseProps) {
  return <FlowbiteSidebarCollapse {...props} />;
}
