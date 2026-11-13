"use client";

import { Card as FlowbiteCard } from "flowbite-react";
import type { ComponentProps, ReactNode } from "react";

export type CardProps = ComponentProps<typeof FlowbiteCard> & {
  title?: ReactNode;
};

export function Card({
  title,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <FlowbiteCard className={className} {...props}>
      {title ? (
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
      ) : null}
      {children}
    </FlowbiteCard>
  );
}
