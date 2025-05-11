// Import jest-dom extensions for additional matchers
import "@testing-library/jest-dom";
import React from "react";

// Suppress React act() warnings
// These warnings appear when state updates happen during tests without being wrapped in act()
// For user-event interactions, this is often not needed as user-event already uses act internally
const originalError = console.error;

console.error = (...args: any[]) => {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    /Warning.*not wrapped in act/.test(args[0])
  ) {
    return;
  }
  originalError(...args);
};

// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    ok: true,
    status: 200,
    headers: new Headers(),
    statusText: "OK",
    type: "basic" as ResponseType,
    url: "https://example.com",
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    redirected: false,
  }),
);

// Mock dependencies that cause import issues
jest.mock("react-dropzone", () => ({}), { virtual: true });
jest.mock("react-easy-crop", () => ({}), { virtual: true });
jest.mock("react-easy-crop/types", () => ({}), { virtual: true });
jest.mock("@/utils/cropImage", () => ({}), { virtual: true });

// Mock HeroUI components
jest.mock(
  "@heroui/button",
  () => {
    return {
      Button: ({
        children,
        onClick,
        type = "button",
        disabled = false,
        isLoading = false,
        color = "primary",
        variant = "solid",
        size = "md",
        className = "",
        startContent,
        ...props
      }: any) => {
        return React.createElement(
          "button",
          {
            onClick,
            type,
            disabled: disabled || isLoading,
            className: `mock-button mock-button-${color} mock-button-${variant} mock-button-${size} ${className}`,
            "data-testid": "mock-button",
            ...props,
          },
          startContent &&
            React.createElement(
              "span",
              { className: "start-content" },
              startContent,
            ),
          isLoading ? "Loading..." : children,
        );
      },
    };
  },
  { virtual: true },
);

jest.mock(
  "@heroui/dropdown",
  () => {
    return {
      Dropdown: ({ children }: any) =>
        React.createElement("div", { className: "mock-dropdown" }, children),
      DropdownTrigger: ({ children }: any) =>
        React.createElement(
          "div",
          { className: "mock-dropdown-trigger" },
          children,
        ),
      DropdownMenu: ({ children, "aria-label": ariaLabel }: any) =>
        React.createElement(
          "div",
          { className: "mock-dropdown-menu", "aria-label": ariaLabel },
          children,
        ),
      DropdownItem: ({
        children,
        onClick,
        startContent,
        className = "",
      }: any) =>
        React.createElement(
          "div",
          {
            onClick,
            className: `mock-dropdown-item ${className}`,
            role: "button",
            tabIndex: 0,
          },
          startContent &&
            React.createElement(
              "span",
              { className: "start-content" },
              startContent,
            ),
          children,
        ),
    };
  },
  { virtual: true },
);

jest.mock(
  "@heroui/avatar",
  () => {
    return {
      Avatar: ({ src, alt, classNames = {} }: any) =>
        React.createElement("img", {
          src,
          alt,
          className: `mock-avatar ${classNames.base || ""}`,
        }),
    };
  },
  { virtual: true },
);

// Mock @heroui/card
jest.mock(
  "@heroui/card",
  () => {
    return {
      Card: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "div",
          { className: `mock-card ${className}`, ...props },
          children,
        ),
      CardHeader: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "div",
          { className: `mock-card-header ${className}`, ...props },
          children,
        ),
      CardBody: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "div",
          { className: `mock-card-body ${className}`, ...props },
          children,
        ),
      CardFooter: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "div",
          { className: `mock-card-footer ${className}`, ...props },
          children,
        ),
    };
  },
  { virtual: true },
);

// Mock @heroui/divider
jest.mock(
  "@heroui/divider",
  () => {
    return {
      Divider: ({ className = "", ...props }: any) =>
        React.createElement("hr", {
          className: `mock-divider ${className}`,
          ...props,
        }),
    };
  },
  { virtual: true },
);

// Mock @heroui/tabs
jest.mock(
  "@heroui/tabs",
  () => {
    return {
      Tabs: ({
        children,
        selectedKey,
        onSelectionChange,
        className = "",
        ...props
      }: any) =>
        React.createElement(
          "div",
          { className: `mock-tabs ${className}`, ...props },
          children,
        ),
      Tab: ({ children, key, title, className = "", ...props }: any) =>
        React.createElement(
          "div",
          { className: `mock-tab ${className}`, "data-key": key, ...props },
          children,
        ),
    };
  },
  { virtual: true },
);

// Mock @heroui/table
jest.mock(
  "@heroui/table",
  () => {
    return {
      Table: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "table",
          { className: `mock-table ${className}`, ...props },
          children,
        ),
      TableHeader: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "thead",
          { className: `mock-table-header ${className}`, ...props },
          children,
        ),
      TableColumn: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "th",
          { className: `mock-table-column ${className}`, ...props },
          children,
        ),
      TableBody: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "tbody",
          { className: `mock-table-body ${className}`, ...props },
          children,
        ),
      TableRow: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "tr",
          { className: `mock-table-row ${className}`, ...props },
          children,
        ),
      TableCell: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "td",
          { className: `mock-table-cell ${className}`, ...props },
          children,
        ),
    };
  },
  { virtual: true },
);

// Mock @heroui/link
jest.mock(
  "@heroui/link",
  () => {
    return {
      Link: ({ children, href, className = "", ...props }: any) =>
        React.createElement(
          "a",
          { href, className: `mock-link ${className}`, ...props },
          children,
        ),
      link: { base: "mock-link-base" },
    };
  },
  { virtual: true },
);

// Mock @heroui/kbd
jest.mock(
  "@heroui/kbd",
  () => {
    return {
      Kbd: ({ children, className = "", ...props }: any) =>
        React.createElement(
          "span",
          { className: `mock-kbd ${className}`, ...props },
          children,
        ),
    };
  },
  { virtual: true },
);

// Mock @heroui/system
jest.mock(
  "@heroui/system",
  () => {
    return {
      HeroUIProvider: ({ children, theme, ...props }: any) =>
        React.createElement(
          "div",
          { className: "mock-heroui-provider", ...props },
          children,
        ),
    };
  },
  { virtual: true },
);

// Mock @heroui/theme
jest.mock(
  "@heroui/theme",
  () => {
    return {
      heroui: {
        themes: { light: {}, dark: {} },
        defaultTheme: "light",
      },
      link: { base: "mock-link-base-style" },
    };
  },
  { virtual: true },
);

// Mock framer-motion to prevent dynamic import issues
jest.mock("framer-motion", () => {
  const actual = jest.requireActual("framer-motion");

  return {
    ...actual,
    // Mock specific components that cause issues
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: { children: React.ReactNode }) =>
        React.createElement("div", props, children),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

// Mock the HeroUI ripple effect that uses dynamic imports
jest.mock("@heroui/ripple", () => {
  return {
    useRipple: () => ({ ripples: null, onClick: jest.fn() }),
  };
});

// Mock next/image
jest.mock("next/image", () => {
  return {
    __esModule: true,
    default: ({ src, alt, ...props }: any) => {
      return React.createElement("img", { src, alt, ...props });
    },
  };
});

// Mock other HeroUI components
jest.mock("@heroui/input", () => {
  return {
    Input: ({
      value = "",
      onChange,
      type = "text",
      className = "",
      placeholder = "",
      name = "",
      id,
      disabled = false,
      ...props
    }: any) => {
      return React.createElement("input", {
        type,
        value,
        onChange,
        className: `mock-input ${className}`,
        placeholder,
        id,
        name,
        disabled,
        ...props,
      });
    },
  };
});

jest.mock("@heroui/switch", () => {
  return {
    Switch: ({
      isSelected = false,
      onChange,
      className = "",
      ...props
    }: any) => {
      return React.createElement(
        "div",
        {
          className: `mock-switch ${className}`,
          "data-testid": "mock-switch",
          ...props,
        },
        React.createElement("input", {
          type: "checkbox",
          checked: isSelected,
          onChange,
        }),
        React.createElement("span", null, ""),
      );
    },
  };
});

jest.mock("@heroui/navbar", () => {
  return {
    Navbar: ({ children, ...props }: any) =>
      React.createElement("nav", props, children),
    NavbarContent: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    NavbarItem: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    NavbarBrand: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    NavbarMenu: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    NavbarMenuItem: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    NavbarMenuToggle: ({ children, ...props }: any) =>
      React.createElement("button", props, children),
  };
});

// Add mock for @heroui/listbox
jest.mock("@heroui/listbox", () => {
  return {
    Listbox: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    ListboxItem: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
  };
});

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: {},
    pathname: "/",
    asPath: "/",
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
    beforePopState: jest.fn(),
    isReady: true,
  }),
}));

// Mock next/head component
jest.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return React.createElement(React.Fragment, null, children);
    },
  };
});
