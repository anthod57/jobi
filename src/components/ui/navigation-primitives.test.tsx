/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Avatar,
  Dropdown,
  DropdownItem,
  Footer,
  FooterCopyright,
  Navbar,
  NavbarBrand,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
  ThemeToggle,
  Tooltip,
} from "@/components/ui";
import { renderWithTheme } from "@/test/render-ui";

describe("Navigation & layout primitives", () => {
  it("renders Sidebar with items", () => {
    renderWithTheme(
      <Sidebar aria-label="Navigation principale">
        <SidebarItems>
          <SidebarItemGroup>
            <SidebarItem href="/">Tableau de bord</SidebarItem>
            <SidebarItem href="/profil">Mon profil</SidebarItem>
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>,
    );
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tableau de bord" })).toHaveAttribute("href", "/");
  });

  it("renders Navbar, Footer, Avatar, Dropdown, Tooltip, and ThemeToggle", () => {
    renderWithTheme(
      <div>
        <Navbar>
          <NavbarBrand href="/">Jobi</NavbarBrand>
          <ThemeToggle />
          <Dropdown label="Compte" inline>
            <DropdownItem href="/profil">Mon profil</DropdownItem>
          </Dropdown>
          <Avatar placeholderInitials="JD" rounded />
          <Tooltip content="Aide">
            <span>Info</span>
          </Tooltip>
        </Navbar>
        <Footer>
          <FooterCopyright by="Jobi" year={2026} />
        </Footer>
      </div>,
    );

    expect(screen.getByRole("link", { name: "Jobi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dark mode|thème|theme/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compte" })).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("Info")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(/Jobi/);
  });
});
