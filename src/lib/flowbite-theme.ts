import { createTheme } from "flowbite-react";

/** Semantic Flowbite overrides — token values live in `globals.css` @theme. */
export const flowbiteTheme = createTheme({
  button: {
    base: "group relative flex items-center justify-center rounded-md text-center font-medium transition-colors focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
    color: {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500/40 dark:bg-primary-600 dark:hover:bg-primary-500",
      default:
        "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500/40 dark:bg-primary-600 dark:hover:bg-primary-500",
      gray: "border border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-secondary-800 dark:hover:text-white",
    },
  },
  card: {
    root: {
      base: "flex rounded-lg border border-secondary-200 bg-white shadow-xs dark:border-secondary-800 dark:bg-secondary-900",
      children: "flex h-full flex-col justify-center gap-4 p-6",
    },
  },
  alert: {
    base: "flex flex-col gap-2 rounded-md border p-4 text-sm",
    color: {
      info: "border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300",
      success:
        "border-success-200 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-950/60 dark:text-success-300",
      warning:
        "border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-800 dark:bg-warning-950/60 dark:text-warning-300",
      failure:
        "border-failure-200 bg-failure-50 text-failure-800 dark:border-failure-800 dark:bg-failure-950/60 dark:text-failure-300",
    },
  },
  badge: {
    root: {
      base: "flex h-fit items-center gap-1 rounded-md font-medium",
      color: {
        primary:
          "bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900",
        success:
          "bg-success-100 text-success-800 hover:bg-success-200 dark:bg-success-950 dark:text-success-300 dark:hover:bg-success-900",
        warning:
          "bg-warning-100 text-warning-800 hover:bg-warning-200 dark:bg-warning-950 dark:text-warning-300 dark:hover:bg-warning-900",
        failure:
          "bg-failure-100 text-failure-800 hover:bg-failure-200 dark:bg-failure-950 dark:text-failure-300 dark:hover:bg-failure-900",
      },
    },
  },
  sidebar: {
    root: {
      base: "h-full",
      inner:
        "h-full overflow-y-auto overflow-x-hidden bg-white px-3 py-4 dark:bg-secondary-900",
    },
    item: {
      base: "flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white",
      active:
        "bg-secondary-100 text-secondary-950 dark:bg-secondary-800 dark:text-white",
      icon: {
        base: "h-4 w-4 shrink-0 text-secondary-500 transition-colors group-hover:text-secondary-900 dark:text-secondary-400 dark:group-hover:text-white",
        active: "text-primary-600 dark:text-primary-400",
      },
    },
    itemGroup: {
      base: "mt-4 space-y-1 border-t border-secondary-200 pt-4 first:mt-0 first:border-t-0 first:pt-0 dark:border-secondary-800",
    },
  },
  navbar: {
    root: {
      base: "border-b border-secondary-200 bg-white px-4 py-2.5 dark:border-secondary-800 dark:bg-secondary-900 sm:px-6",
    },
  },
  footer: {
    root: {
      base: "w-full rounded-none border-t border-secondary-200 bg-transparent px-6 py-4 shadow-none dark:border-secondary-800 dark:bg-transparent",
    },
    copyright: {
      base: "text-xs text-secondary-500 dark:text-secondary-400",
    },
  },
  dropdown: {
    floating: {
      base: "z-20 w-fit divide-y divide-secondary-100 rounded-lg border border-secondary-200 bg-white shadow-sm focus:outline-none dark:divide-secondary-800 dark:border-secondary-800 dark:bg-secondary-900",
      item: {
        base: "flex w-full cursor-pointer items-center justify-start px-3.5 py-2 text-sm text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 focus:bg-secondary-100 focus:outline-none dark:text-secondary-200 dark:hover:bg-secondary-800 dark:hover:text-white",
      },
      header:
        "block px-3.5 py-2 text-xs font-medium text-secondary-500 dark:text-secondary-400",
    },
  },
  avatar: {
    root: {
      initials: {
        base: "relative inline-flex items-center justify-center overflow-hidden bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300",
      },
    },
  },
  tooltip: {
    base: "absolute z-30 inline-block rounded-md px-2.5 py-1.5 text-xs font-medium shadow-xs",
    style: {
      dark: "bg-secondary-900 text-white dark:bg-secondary-800",
      light:
        "border border-secondary-200 bg-white text-secondary-900",
      auto: "border border-secondary-200 bg-white text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-white",
    },
  },
});
