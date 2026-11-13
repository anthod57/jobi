"use client";

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { Alert as FlowbiteAlert } from "flowbite-react";
import type { ComponentProps, FC } from "react";

export type AlertVariant = "info" | "success" | "warning" | "failure";

const alertColors: Record<
  AlertVariant,
  NonNullable<ComponentProps<typeof FlowbiteAlert>["color"]>
> = {
  info: "info",
  success: "success",
  warning: "warning",
  failure: "failure",
};

const alertIcons: Record<AlertVariant, FC<ComponentProps<"svg">>> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  failure: ExclamationCircleIcon,
};

export type AlertProps = Omit<
  ComponentProps<typeof FlowbiteAlert>,
  "color"
> & {
  variant?: AlertVariant;
};

export function Alert({
  variant = "info",
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <FlowbiteAlert
      color={alertColors[variant]}
      icon={icon ?? alertIcons[variant]}
      className={className}
      {...props}
    >
      {children}
    </FlowbiteAlert>
  );
}
