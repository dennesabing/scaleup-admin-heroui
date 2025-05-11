import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { HeroUIProvider } from "@heroui/system";

import { fontSans, fontMono } from "@/config/fonts";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { TeamProvider } from "@/contexts/TeamContext";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  // Global error handling to prevent unhandled runtime errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);

      // Only prevent default for auth-related errors
      if (
        event.error?.message?.includes("Invalid email or password") ||
        router.pathname.startsWith("/auth/")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [router.pathname]);

  // Check if the current page needs organization/team context
  const needsOrganizationContext = () => {
    // Only include organization context for paths that explicitly need it
    return (
      router.pathname.startsWith("/organizations") ||
      router.pathname.startsWith("/teams") ||
      router.pathname.startsWith("/dashboard") ||
      router.pathname === "/" // Home page may need org context
    );
  };

  // Render the appropriate layout based on the page type
  const renderPage = () => {
    const pageWithLayout = getLayout(<Component {...pageProps} />);

    // Only wrap with Organization/Team providers if needed
    if (needsOrganizationContext()) {
      return (
        <OrganizationProvider>
          <TeamProvider>{pageWithLayout}</TeamProvider>
        </OrganizationProvider>
      );
    }

    // Otherwise return the page without organization context
    return pageWithLayout;
  };

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider>
        <ErrorBoundary>{renderPage()}</ErrorBoundary>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
