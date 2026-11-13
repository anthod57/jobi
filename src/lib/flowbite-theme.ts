import { createTheme } from "flowbite-react";

/** Semantic Flowbite overrides — token values live in `globals.css` @theme. */
export const flowbiteTheme = createTheme({
  button: {
    color: {
      primary:
        "text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800",
      default:
        "text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800",
      gray: "bg-secondary-700 text-white hover:bg-secondary-800 focus:ring-4 focus:ring-secondary-300 dark:bg-secondary-600 dark:hover:bg-secondary-700 dark:focus:ring-secondary-800",
    },
  },
  alert: {
    color: {
      success:
        "border-success-500 bg-success-100 text-success-700 dark:border-success-400 dark:bg-success-900 dark:text-success-300",
      warning:
        "border-warning-500 bg-warning-100 text-warning-700 dark:border-warning-400 dark:bg-warning-900 dark:text-warning-300",
      failure:
        "border-failure-500 bg-failure-100 text-failure-700 dark:border-failure-400 dark:bg-failure-900 dark:text-failure-300",
    },
  },
  badge: {
    root: {
      color: {
        primary:
          "bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800",
        success:
          "bg-success-100 text-success-800 hover:bg-success-200 dark:bg-success-900 dark:text-success-300 dark:hover:bg-success-800",
        warning:
          "bg-warning-100 text-warning-800 hover:bg-warning-200 dark:bg-warning-900 dark:text-warning-300 dark:hover:bg-warning-800",
        failure:
          "bg-failure-100 text-failure-800 hover:bg-failure-200 dark:bg-failure-900 dark:text-failure-300 dark:hover:bg-failure-800",
      },
    },
  },
});
