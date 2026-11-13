"use client";

import { FileInput as FlowbiteFileInput } from "flowbite-react";
import type { ComponentProps } from "react";

export type FileInputProps = ComponentProps<typeof FlowbiteFileInput>;

export function FileInput({ className, ...props }: FileInputProps) {
  return <FlowbiteFileInput className={className} {...props} />;
}
