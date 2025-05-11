import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

import { Head } from "./head";

import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  BuildingIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/authMiddleware";
import { logout, getCurrentUser, getUser } from "@/lib/auth";
import { EmailVerificationBanner } from "@/components";

interface SidebarItem {
  title: string;
  href: string;
  icon:
    | "LayoutDashboard"
    | "Users"
    | "ShoppingBag"
    | "Settings"
    | "BuildingIcon";
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Organizations",
    href: "/organizations",
    icon: "BuildingIcon",
  },
  {
    title: "Users",
    href: "/users",
    icon: "Users",
  },
  {
    title: "Products",
    href: "/products",
    icon: "ShoppingBag",
  },
  {
    title: "Account",
    href: "/account",
    icon: "Users",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
  },
];

const IconComponents = {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings,
  BuildingIcon,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use auth middleware to protect all admin pages
  useAuth();

  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{
    email: string;
    name: string;
    emailVerified: boolean;
    avatarUrl?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from API and update localStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user data from the API
        await getUser();

        // After API call completes, get the updated user from localStorage
        const currentUser = getCurrentUser();

        if (currentUser) {
          setUser({
            email: currentUser.email,
            name: currentUser.name || currentUser.email,
            emailVerified: !!currentUser.email_verified_at,
            avatarUrl: currentUser.profile?.avatar_url,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Listen for avatar updates
    const handleAvatarUpdate = (event: CustomEvent<{ avatarUrl: string }>) => {
      setUser((prevUser) => {
        if (!prevUser) return prevUser;

        return {
          ...prevUser,
          avatarUrl: event.detail.avatarUrl,
        };
      });
    };

    // Add event listener for avatar updates
    window.addEventListener(
      "user:avatar-updated",
      handleAvatarUpdate as EventListener,
    );

    // Clean up event listener
    return () => {
      window.removeEventListener(
        "user:avatar-updated",
        handleAvatarUpdate as EventListener,
      );
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // Get avatar source - use user's avatar if available, otherwise use Pravatar
  const avatarSrc =
    user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.email || "admin"}`;

  return (
    <div className="relative flex h-screen bg-content1">
      <Head />

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} 
          h-screen bg-background transition-all duration-300 ease-in-out 
          border-r border-divider flex flex-col fixed left-0 top-0 bottom-0 z-30`}
      >
        <div className="p-4 flex justify-between items-center border-b border-divider">
          <Link
            className={`${!sidebarOpen && "hidden"} text-xl font-bold text-primary`}
            href="/dashboard"
          >
            ScaleUp CRM
          </Link>
          <Button
            isIconOnly
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            variant="light"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {sidebarItems.map((item) => {
              const Icon = IconComponents[item.icon];
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/dashboard" &&
                  router.pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    className={`flex items-center p-3 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-content2"
                    }`}
                    href={item.href}
                  >
                    <Icon size={20} />
                    {sidebarOpen && <span className="ml-3">{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-divider">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <img
                  alt="User Avatar"
                  className="h-full w-full object-cover"
                  src={avatarSrc}
                />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-default-500">
                    {user?.email || "admin@example.com"}
                  </p>
                </div>
              )}
            </div>

            <Button
              className={sidebarOpen ? "px-2" : ""}
              color="danger"
              isIconOnly={!sidebarOpen}
              size="sm"
              variant="light"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              {sidebarOpen && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="p-6">
          {/* Email verification banner - only show when not loading */}
          {!isLoading && user && !user.emailVerified && (
            <EmailVerificationBanner className="mb-6" />
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
