"use client";

import {
  Bars3Icon,
  BriefcaseIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FC, type ReactNode, type SVGProps, useEffect, useState } from "react";

import {
  Avatar,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Footer,
  FooterCopyright,
  FooterLink,
  FooterLinkGroup,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
  ThemeToggle,
} from "@/components/ui";

type NavItem = {
  href: string;
  label: string;
  icon: FC<SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: HomeIcon },
  { href: "/offres", label: "Offres", icon: BriefcaseIcon },
  { href: "/candidatures", label: "Candidatures", icon: DocumentTextIcon },
  { href: "/profil", label: "Mon profil", icon: UserCircleIcon },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const currentNav = NAV_ITEMS.find((item) => isRouteActive(pathname, item.href));
  const pageLabel = currentNav?.label ?? "Jobi";

  const sidebarNav = (onNavigate?: () => void) => (
    <Sidebar aria-label="Navigation principale" className="w-60">
      <div className="mb-4 flex items-center justify-between px-3 pt-1">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:text-white"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-xs font-bold text-white">
            J
          </span>
          <span>Jobi</span>
        </Link>
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Fermer le menu"
            className="rounded-md p-1 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 lg:hidden dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <SidebarItems>
        <SidebarItemGroup>
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(pathname, item.href);
            return (
              <SidebarItem
                key={item.href}
                as={Link}
                href={item.href}
                icon={item.icon}
                active={active}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </SidebarItem>
            );
          })}
        </SidebarItemGroup>
      </SidebarItems>
    </Sidebar>
  );

  return (
    <div className="flex min-h-screen bg-secondary-50 text-secondary-900 dark:bg-secondary-950 dark:text-secondary-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Aller au contenu principal
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 border-r border-secondary-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen dark:border-secondary-800 dark:bg-secondary-900">
        {sidebarNav()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-secondary-950/40"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 flex h-full border-r border-secondary-200 bg-white dark:border-secondary-800 dark:bg-secondary-900">
            {sidebarNav(() => setMobileOpen(false))}
          </div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-secondary-200 bg-white px-4 sm:px-6 dark:border-secondary-800 dark:bg-secondary-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={mobileOpen}
              className="rounded-md p-1.5 text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 lg:hidden dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-white"
            >
              <Bars3Icon className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-200">
              {pageLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar
                  placeholderInitials="JB"
                  rounded
                  size="sm"
                  aria-label="Menu utilisateur"
                />
              }
            >
              <DropdownHeader>
                <span className="block text-sm font-medium text-secondary-900 dark:text-white">
                  Instance locale
                </span>
                <span className="block truncate text-xs text-secondary-500 dark:text-secondary-400">
                  Jobi
                </span>
              </DropdownHeader>
              <DropdownItem as={Link} href="/profil">
                Mon profil
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem as={Link} href="/api/health">
                Statut API
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-page">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <Footer>
          <FooterCopyright by="Jobi — Instance locale" year={2026} />
          <FooterLinkGroup className="mt-2 flex gap-4 text-xs sm:mt-0">
            <FooterLink as={Link} href="/profil">
              Mon profil
            </FooterLink>
            <FooterLink as={Link} href="/api/health">
              Santé API
            </FooterLink>
          </FooterLinkGroup>
        </Footer>
      </div>
    </div>
  );
}
