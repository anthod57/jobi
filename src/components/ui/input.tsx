"use client";

import { TextInput as FlowbiteTextInput } from "flowbite-react";
import { forwardRef } from "react";
import type { ComponentProps } from "react";

export type InputProps = ComponentProps<typeof FlowbiteTextInput>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    return <FlowbiteTextInput ref={ref} className={className} {...props} />;
  },
);
