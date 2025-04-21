import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Users, SearchIcon, Settings } from "@/components/icons";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/authMiddleware";

import AdminLayout from "@/layouts/admin";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "active", date: "2023-11-28" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "pending", date: "2023-11-27" },
  { id: 3, name: "Robert Johnson", email: "robert@example.com", role: "Member", status: "active", date: "2023-11-26" },
  { id: 4, name: "Emily Davis", email: "emily@example.com", role: "Editor", status: "inactive", date: "2023-11-25" },
  { id: 5, name: "Michael Wilson", email: "michael@example.com", role: "Member", status: "active", date: "2023-11-24" },
  { id: 6, name: "Sarah Brown", email: "sarah@example.com", role: "Member", status: "active", date: "2023-11-23" },
  { id: 7, name: "David Miller", email: "david@example.com", role: "Editor", status: "pending", date: "2023-11-22" },
  { id: 8, name: "Linda Wilson", email: "linda@example.com", role: "Member", status: "inactive", date: "2023-11-21" },
];

export default function UsersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use the useAuth hook for authentication protection
  useAuth();

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-default-500">Manage your users</p>
        </div>
        <Button color="primary" startContent={<Users size={18} />}>
          Add New User
        </Button>
      </div>

      <div className="bg-background shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="w-full sm:max-w-[50%]">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<SearchIcon className="text-default-400" />}
              isClearable
              onClear={() => setSearchTerm("")}
            />
          </div>
        </div>
        <Divider />
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-divider">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-divider">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-default-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.role}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button isIconOnly size="sm" variant="light">
                          <SearchIcon className="text-default-500" size={18} />
                        </Button>
                        <Button isIconOnly size="sm" variant="light">
                          <Settings className="text-default-500" size={18} />
                        </Button>
                      </div>
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

UsersPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
}; 