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

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider>
        <ErrorBoundary>
          <OrganizationProvider>
            <TeamProvider>
              {getLayout(<Component {...pageProps} />)}
            </TeamProvider>
          </OrganizationProvider>
        </ErrorBoundary>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
