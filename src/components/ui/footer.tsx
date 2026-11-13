"use client";

import {
  Footer as FlowbiteFooter,
  FooterCopyright as FlowbiteFooterCopyright,
  FooterDivider as FlowbiteFooterDivider,
  FooterLink as FlowbiteFooterLink,
  FooterLinkGroup as FlowbiteFooterLinkGroup,
} from "flowbite-react";
import type { ComponentProps } from "react";

export type FooterProps = ComponentProps<typeof FlowbiteFooter>;
export type FooterCopyrightProps = ComponentProps<typeof FlowbiteFooterCopyright>;
export type FooterLinkProps = ComponentProps<typeof FlowbiteFooterLink>;
export type FooterLinkGroupProps = ComponentProps<typeof FlowbiteFooterLinkGroup>;
export type FooterDividerProps = ComponentProps<typeof FlowbiteFooterDivider>;

export function Footer(props: FooterProps) {
  return <FlowbiteFooter {...props} />;
}

export function FooterCopyright(props: FooterCopyrightProps) {
  return <FlowbiteFooterCopyright {...props} />;
}

export function FooterLink(props: FooterLinkProps) {
  return <FlowbiteFooterLink {...props} />;
}

export function FooterLinkGroup(props: FooterLinkGroupProps) {
  return <FlowbiteFooterLinkGroup {...props} />;
}

export function FooterDivider(props: FooterDividerProps) {
  return <FlowbiteFooterDivider {...props} />;
}
