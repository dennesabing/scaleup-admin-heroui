import { Head } from "./head";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { useRouter } from "next/router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, ShoppingBag, Settings } from "@/components/icons";

interface SidebarItem {
  title: string;
  href: string;
  icon: "LayoutDashboard" | "Users" | "ShoppingBag" | "Settings";
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: "LayoutDashboard",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: "Users",
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: "ShoppingBag",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: "Settings",
  },
];

const IconComponents = {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          <Link href="/admin" className={`${!sidebarOpen && "hidden"} text-xl font-bold text-primary`}>
            Admin Panel
          </Link>
          <Button 
            isIconOnly 
            variant="light" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {sidebarItems.map((item) => {
              const Icon = IconComponents[item.icon];
              const isActive = router.pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center p-3 rounded-md transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-foreground hover:bg-content2"
                    }`}
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
          <div className="flex items-center">
            <div className="relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <img
                src="https://i.pravatar.cc/150?u=admin"
                alt="Admin User"
                className="h-full w-full object-cover"
              />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-default-500">admin@example.com</p>
              </div>
            )}
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
          {children}
        </div>
      </main>
    </div>
  );
} 