"use client";

import { Button as FlowbiteButton, Spinner } from "flowbite-react";
import Link from "next/link";
import type { ComponentProps } from "react";

type FlowbiteButtonProps = ComponentProps<typeof FlowbiteButton>;

export type ButtonProps = FlowbiteButtonProps & {
  isProcessing?: boolean;
};

export function Button({
  isProcessing = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <FlowbiteButton
      as={props.as ?? (props.href ? Link : undefined)}
      disabled={disabled || isProcessing}
      className={className}
      {...props}
    >
      {isProcessing ? (
        <span className="inline-flex items-center gap-2">
          <Spinner size="sm" aria-hidden />
          {children}
        </span>
      ) : (
        children
      )}
    </FlowbiteButton>
  );
}
