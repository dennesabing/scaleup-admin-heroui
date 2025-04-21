// Import jest-dom extensions for additional matchers
import '@testing-library/jest-dom';
import React from 'react';

// Suppress React act() warnings
// These warnings appear when state updates happen during tests without being wrapped in act()
// For user-event interactions, this is often not needed as user-event already uses act internally
const originalError = console.error;
console.error = (...args: any[]) => {
  if (args[0] && typeof args[0] === 'string' && /Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalError(...args);
};

// Mock fetch
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Headers(),
    statusText: 'OK',
    type: 'basic' as ResponseType,
    url: 'https://example.com',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    redirected: false,
  })
);

// Mock dependencies that cause import issues
jest.mock('react-dropzone', () => ({}), { virtual: true });
jest.mock('react-easy-crop', () => ({}), { virtual: true });
jest.mock('react-easy-crop/types', () => ({}), { virtual: true });
jest.mock('@/utils/cropImage', () => ({}), { virtual: true });

// Mock framer-motion to prevent dynamic import issues
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    // Mock specific components that cause issues
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: { children: React.ReactNode }) => 
        React.createElement('div', props, children),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => 
      React.createElement(React.Fragment, null, children),
  };
});

// Mock the HeroUI ripple effect that uses dynamic imports
jest.mock('@heroui/ripple', () => {
  return {
    useRipple: () => ({ ripples: null, onClick: jest.fn() }),
  };
});

// Mock the HeroUI Button component that's causing issues in tests
jest.mock('@heroui/button', () => {
  return {
    Button: ({ 
      children, 
      onClick, 
      type = 'button', 
      disabled = false,
      isLoading = false,
      color = 'primary',
      variant = 'solid',
      size = 'md',
      className = '',
      ...props 
    }: any) => {
      return React.createElement(
        'button',
        { 
          onClick, 
          type, 
          disabled: disabled || isLoading,
          className: `mock-button mock-button-${color} mock-button-${variant} mock-button-${size} ${className}`,
          "data-testid": "mock-button",
          ...props 
        },
        isLoading ? 'Loading...' : children
      );
    }
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: ({ src, alt, ...props }: any) => {
      return React.createElement('img', { src, alt, ...props });
    }
  };
});

// Mock other HeroUI components
jest.mock('@heroui/input', () => {
  return {
    Input: ({ 
      value = '', 
      onChange, 
      type = 'text', 
      className = '', 
      placeholder = '',
      name = '',
      id,
      disabled = false,
      ...props 
    }: any) => {
      return React.createElement(
        'input',
        { 
          type, 
          value, 
          onChange, 
          className: `mock-input ${className}`, 
          placeholder,
          id,
          name,
          disabled,
          ...props 
        }
      );
    }
  };
});

jest.mock('@heroui/switch', () => {
  return {
    Switch: ({ 
      isSelected = false, 
      onChange, 
      className = '', 
      ...props 
    }: any) => {
      return React.createElement(
        'div',
        { 
          className: `mock-switch ${className}`,
          "data-testid": "mock-switch",
          ...props 
        },
        React.createElement(
          'input',
          { 
            type: 'checkbox', 
            checked: isSelected, 
            onChange 
          }
        ),
        React.createElement(
          'span',
          null,
          ""
        )
      );
    }
  };
});

jest.mock('@heroui/navbar', () => {
  return {
    Navbar: ({ children, ...props }: any) => React.createElement('nav', props, children),
    NavbarContent: ({ children, ...props }: any) => React.createElement('div', props, children),
    NavbarItem: ({ children, ...props }: any) => React.createElement('div', props, children),
    NavbarBrand: ({ children, ...props }: any) => React.createElement('div', props, children),
    NavbarMenu: ({ children, ...props }: any) => React.createElement('div', props, children),
    NavbarMenuItem: ({ children, ...props }: any) => React.createElement('div', props, children),
    NavbarMenuToggle: ({ children, ...props }: any) => React.createElement('button', props, children),
  };
});

jest.mock('@heroui/listbox', () => {
  return {
    Listbox: ({ children, ...props }: any) => React.createElement('div', props, children),
    ListboxItem: ({ children, ...props }: any) => React.createElement('div', props, children),
  };
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/',
    asPath: '/',
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
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return React.createElement(React.Fragment, null, children);
    },
  };
}); 