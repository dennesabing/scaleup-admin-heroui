import React, { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

import { useOrganization } from "@/contexts/OrganizationContext";
import { createTeam } from "@/lib/services/teamService";
import { TeamModel } from "@/lib/team";

import MainLayout from "@/layouts/MainLayout";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import { useApiError } from "@/hooks/useApiError";

type FormValues = {
  name: string;
  description: string;
};

export default function NewTeamPage() {
  const router = useRouter();
  const { id } = router.query;
  const organizationId = id as string;
  
  const { currentOrganization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, setError, clearError } = useApiError();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  
  const onSubmit = async (data: FormValues) => {
    if (!organizationId) return;
    
    try {
      setIsSubmitting(true);
      clearError();
      
      const newTeam = await createTeam(organizationId, {
        name: data.name,
        description: data.description,
        organization_id: parseInt(organizationId),
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      });
      
      router.push(`/organizations/${organizationId}/teams/${newTeam.id}`);
    } catch (err) {
      console.error("Failed to create team:", err);
      setError("Failed to create team. Please try again later.");
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Create New Team</h1>
          
          {error && (
            <Alert type="error" className="mb-4" onDismiss={clearError}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register("name", { required: "Team name is required" })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Brief description of this team's purpose"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                color="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={isSubmitting}
                className="flex items-center"
              >
                {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                Create Team
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
} 