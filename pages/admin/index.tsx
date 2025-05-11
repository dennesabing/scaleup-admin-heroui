import { Divider } from "@heroui/divider";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import {
  Users,
  DollarSign,
  ShoppingBag,
  TicketIcon,
  X as XIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/authMiddleware";
import AdminLayout from "@/layouts/admin";

const stats = [
  { label: "Total Users", value: "12,361", icon: "Users", change: "+12%" },
  { label: "Revenue", value: "$24,580", icon: "DollarSign", change: "+18%" },
  {
    label: "Active Products",
    value: "142",
    icon: "ShoppingBag",
    change: "+5%",
  },
  { label: "Support Tickets", value: "9", icon: "TicketIcon", change: "-3%" },
];

const IconComponents = {
  Users,
  DollarSign,
  ShoppingBag,
  TicketIcon,
};

const recentUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    status: "active",
    date: "2023-11-28",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    status: "pending",
    date: "2023-11-27",
  },
  {
    id: 3,
    name: "Robert Johnson",
    email: "robert@example.com",
    status: "active",
    date: "2023-11-26",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily@example.com",
    status: "inactive",
    date: "2023-11-25",
  },
  {
    id: 5,
    name: "Michael Wilson",
    email: "michael@example.com",
    status: "active",
    date: "2023-11-24",
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  // Use the useAuth hook for authentication protection
  useAuth();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for alert messages in session storage or query params
  useEffect(() => {
    // Check for message in session storage
    if (typeof window !== "undefined") {
      const sessionMessage = sessionStorage.getItem("alertMessage");

      if (sessionMessage) {
        setSuccessMessage(sessionMessage);
        // Remove message after displaying it
        sessionStorage.removeItem("alertMessage");
      }
    }

    // For backward compatibility, check for message in query params
    // and clean up the URL if found
    if (router.isReady && router.query.message) {
      setSuccessMessage(router.query.message as string);

      // Clean up the URL
      const { pathname } = router;
      const query = { ...router.query };

      delete query.message;

      router.push({ pathname, query }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query]);

  const dismissMessage = () => {
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-default-500">Welcome to your admin dashboard</p>
      </div>

      {successMessage && (
        <div className="rounded-md bg-success-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-success"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-grow">
              <p className="text-sm text-success-700">{successMessage}</p>
            </div>
            <div>
              <button
                className="inline-flex text-success-400 hover:text-success-500"
                type="button"
                onClick={dismissMessage}
              >
                <span className="sr-only">Dismiss</span>
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = IconComponents[stat.icon as keyof typeof IconComponents];

          return (
            <div key={index} className="bg-background shadow-sm rounded-lg p-5">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <p className="text-sm text-default-500">{stat.label}</p>
                  <p className="text-3xl font-semibold mt-1">{stat.value}</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium ${
                      stat.change.startsWith("+")
                        ? "bg-success-100 text-success-800"
                        : "bg-danger-100 text-danger-800"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Icon className="text-primary" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-4" />

      <div className="bg-background shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">Recent Users</h2>
        </div>
        <Divider />
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-divider">
              <thead>
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider"
                    scope="col"
                  >
                    Name
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider"
                    scope="col"
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider"
                    scope="col"
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider"
                    scope="col"
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-divider">
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-default-500">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-success-100 text-success-800"
                            : user.status === "pending"
                              ? "bg-warning-100 text-warning-800"
                              : "bg-danger-100 text-danger-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default-500">
                      {user.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

AdminDashboard.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
