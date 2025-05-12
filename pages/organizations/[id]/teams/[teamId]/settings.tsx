import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

import { useOrganization } from "@/contexts/OrganizationContext";
import { useApiError } from "@/hooks/useApiError";
import { getTeam, updateTeam } from "@/lib/services/teamService";
import { TeamModel } from "@/lib/team";

import MainLayout from "@/layouts/MainLayout";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";

type FormValues = {
  name: string;
  description: string;
};

export default function TeamSettingsPage() {
  const router = useRouter();
  const { id, teamId } = router.query;
  const organizationId = id as string;
  const teamIdAsString = teamId as string;
  
  const { currentOrganization } = useOrganization();
  const [team, setTeam] = useState<TeamModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, setError, clearError } = useApiError();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>();
  
  useEffect(() => {
    if (organizationId && teamId) {
      loadTeam();
    }
  }, [organizationId, teamId]);
  
  const loadTeam = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const teamData = await getTeam(organizationId, teamIdAsString);
      setTeam(teamData);
      
      // Set form default values
      reset({
        name: teamData.name,
        description: teamData.description || "",
      });
    } catch (err) {
      console.error("Failed to load team:", err);
      setError("Failed to load team data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!organizationId || !teamId) return;
    
    try {
      setIsSubmitting(true);
      clearError();
      
      const updatedTeam = await updateTeam(organizationId, teamIdAsString, {
        name: data.name,
        description: data.description,
        organization_id: parseInt(organizationId),
      });
      
      setTeam(updatedTeam);
      reset({
        name: updatedTeam.name,
        description: updatedTeam.description || "",
      });
      
      // Show success message (could use a toast notification here)
      alert("Team settings updated successfully");
    } catch (err) {
      console.error("Failed to update team:", err);
      setError("Failed to update team. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner className="w-10 h-10" />
        </div>
      </MainLayout>
    );
  }
  
  if (!team) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert type="error">Team not found or you don't have access.</Alert>
          <div className="mt-4">
            <Button onClick={() => router.back()} color="secondary">
              Go Back
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Team Settings</h1>
        
        {error && (
          <Alert type="error" className="mb-4" onDismiss={clearError}>
            {error}
          </Alert>
        )}
        
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name", { required: "Team name is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register("description")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    placeholder="Describe the purpose of this team"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => router.back()}
                    className="mr-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting || !isDirty}
                    className="flex items-center"
                  >
                    {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 