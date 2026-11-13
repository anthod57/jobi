"use client";

import {
  Navbar as FlowbiteNavbar,
  NavbarBrand as FlowbiteNavbarBrand,
  NavbarCollapse as FlowbiteNavbarCollapse,
  NavbarLink as FlowbiteNavbarLink,
  NavbarToggle as FlowbiteNavbarToggle,
} from "flowbite-react";
import type { ComponentProps } from "react";

export type NavbarProps = ComponentProps<typeof FlowbiteNavbar>;
export type NavbarBrandProps = ComponentProps<typeof FlowbiteNavbarBrand>;
export type NavbarCollapseProps = ComponentProps<typeof FlowbiteNavbarCollapse>;
export type NavbarLinkProps = ComponentProps<typeof FlowbiteNavbarLink>;
export type NavbarToggleProps = ComponentProps<typeof FlowbiteNavbarToggle>;

export function Navbar(props: NavbarProps) {
  return <FlowbiteNavbar {...props} />;
}

export function NavbarBrand(props: NavbarBrandProps) {
  return <FlowbiteNavbarBrand {...props} />;
}

export function NavbarCollapse(props: NavbarCollapseProps) {
  return <FlowbiteNavbarCollapse {...props} />;
}

export function NavbarLink(props: NavbarLinkProps) {
  return <FlowbiteNavbarLink {...props} />;
}

export function NavbarToggle(props: NavbarToggleProps) {
  return <FlowbiteNavbarToggle {...props} />;
}
