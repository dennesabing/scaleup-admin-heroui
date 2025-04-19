import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useRouter } from "next/router";
import { deleteUserAccount } from "../../lib/userService";

interface DeleteAccountSectionProps {
  onError: (error: unknown) => void;
}

export default function DeleteAccountSection({ onError }: DeleteAccountSectionProps) {
  const router = useRouter();
  const [deleteForm, setDeleteForm] = useState({
    password: "",
    confirm: "",
  });
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleDeleteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeleteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleteLoading(true);
    
    try {
      if (deleteForm.confirm !== "DELETE") {
        throw new Error('Please type "DELETE" to confirm account deletion');
      }
      
      await deleteUserAccount(deleteForm.password);
      router.push("/auth/login");
    } catch (err) {
      onError(err);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className="bg-danger-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-danger">Delete Account</h2>
      <p className="text-danger-700 mb-6">
        Once your account is deleted, all of its resources and data will be permanently deleted.
        Before deleting your account, please download any data or information that you wish to retain.
      </p>
      
      <form onSubmit={handleDeleteAccount} className="space-y-4">
        <div>
          <label htmlFor="delete_password" className="block text-sm font-medium mb-1 text-danger-700">
            Current Password
          </label>
          <Input
            id="delete_password"
            name="password"
            type="password"
            value={deleteForm.password}
            onChange={handleDeleteChange}
            className="w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="delete_confirm" className="block text-sm font-medium mb-1 text-danger-700">
            Type "DELETE" to confirm
          </label>
          <Input
            id="delete_confirm"
            name="confirm"
            type="text"
            value={deleteForm.confirm}
            onChange={handleDeleteChange}
            className="w-full"
            required
          />
        </div>
        
        <div className="pt-3">
          <Button
            type="submit"
            color="danger"
            isLoading={isDeleteLoading}
            isDisabled={isDeleteLoading || deleteForm.confirm !== "DELETE"}
          >
            Delete Account
          </Button>
        </div>
      </form>
    </div>
  );
} 