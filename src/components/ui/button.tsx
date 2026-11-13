"use client";

import { Button as FlowbiteButton, Spinner } from "flowbite-react";
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
