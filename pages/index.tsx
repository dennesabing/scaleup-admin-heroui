import { useEffect } from "react";
import { useRouter } from "next/router";

import { getAuth } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (typeof window !== "undefined") {
      const auth = getAuth();

      if (auth) {
        // Redirect to dashboard if authenticated
        router.push("/dashboard");
      } else {
        // Redirect to login if not authenticated
        router.push("/auth/login");
      }
    }
  }, [router]);

  // This page will not be rendered for long, but we still need to return something
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Redirecting...</h1>
        <p className="mt-2 text-default-500">
          Please wait while we redirect you to the appropriate page.
        </p>
      </div>
    </div>
  );
}
