import { useEffect, useState, useRef } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { useRouter } from "next/router";

import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/lib/authMiddleware";
import {
  getOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationAttributes,
  createOrganizationAttributes,
  updateOrganizationAttribute,
  deleteOrganizationAttribute,
} from "@/lib/services/organizationService";
import { OrganizationModel } from "@/types/organization";
import { PlusIcon, Trash } from "@/components/icons";
import AdminLayout from "@/layouts/admin";

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<OrganizationModel | null>(
    null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Attributes state
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [newAttributeKey, setNewAttributeKey] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [attributesError, setAttributesError] = useState<string | null>(null);
  const [attributesSuccess, setAttributesSuccess] = useState<string | null>(
    null,
  );

  // Refs to prevent duplicate API calls
  const isLoadingOrgRef = useRef(false);
  const isLoadingAttributesRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const router = useRouter();
  const { id } = router.query;

  // Protect this route
  const { isAuthenticated } = useAuth();
  const { setCurrentOrganizationId } = useOrganization();

  // Load organization data
  useEffect(() => {
    // Skip if no id or if we're already loading
    if (!id || typeof id !== "string" || isLoadingOrgRef.current) return;

    // For subsequent id changes, we should always load
    if (initialLoadDoneRef.current && organization?.id === parseInt(id)) {
      return;
    }

    const loadOrganization = async () => {
      try {
        isLoadingOrgRef.current = true;
        setIsLoading(true);
        setError(null);

        const orgData = await getOrganization(id);

        setOrganization(orgData);
        setName(orgData.name);
        setDescription(orgData.description || "");

        // Set this as the current organization
        setCurrentOrganizationId(orgData.id);

        // Load attributes
        await loadAttributes(id);
        initialLoadDoneRef.current = true;
      } catch (err) {
        console.error("Failed to load organization:", err);
        setError("Failed to load organization details. Please try again.");
      } finally {
        setIsLoading(false);
        isLoadingOrgRef.current = false;
      }
    };

    loadOrganization();
  }, [id, setCurrentOrganizationId, organization]);

  const loadAttributes = async (organizationId: string | number) => {
    // Skip if already loading attributes
    if (isLoadingAttributesRef.current) return;

    try {
      isLoadingAttributesRef.current = true;
      setIsLoadingAttributes(true);
      setAttributesError(null);

      const attributesData = await getOrganizationAttributes(organizationId);

      setAttributes(attributesData || {});
    } catch (err) {
      console.error("Failed to load organization attributes:", err);
      setAttributesError(
        "Failed to load organization attributes. Please try again.",
      );
    } finally {
      setIsLoadingAttributes(false);
      isLoadingAttributesRef.current = false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || typeof id !== "string") return;
    if (!name.trim()) {
      setError("Organization name is required");

      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updatedOrg = await updateOrganization(id, {
        name,
        description,
      });

      setOrganization(updatedOrg);
      setSuccessMessage("Organization updated successfully");
    } catch (err) {
      console.error("Failed to update organization:", err);
      setError("Failed to update organization. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || typeof id !== "string") return;

    if (
      !window.confirm(
        "Are you sure you want to delete this organization? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await deleteOrganization(id);

      // Clear current organization and redirect
      setCurrentOrganizationId(null);
      router.push("/organizations");
    } catch (err) {
      console.error("Failed to delete organization:", err);
      setError("Failed to delete organization. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || typeof id !== "string") return;
    if (!newAttributeKey.trim()) {
      setAttributesError("Attribute key is required");

      return;
    }

    try {
      setAttributesError(null);
      setAttributesSuccess(null);

      // Create a new attribute object with the new key-value pair
      const updatedAttributes = {
        ...attributes,
        [newAttributeKey]: newAttributeValue,
      };

      await createOrganizationAttributes(id, updatedAttributes);

      // Update local state
      setAttributes(updatedAttributes);
      setNewAttributeKey("");
      setNewAttributeValue("");
      setAttributesSuccess("Attribute added successfully");
    } catch (err) {
      console.error("Failed to add attribute:", err);
      setAttributesError("Failed to add attribute. Please try again.");
    }
  };

  const handleUpdateAttribute = async (key: string, value: any) => {
    if (!id || typeof id !== "string") return;

    try {
      setAttributesError(null);
      setAttributesSuccess(null);

      await updateOrganizationAttribute(id, key, value);

      // Update local state
      setAttributes({
        ...attributes,
        [key]: value,
      });

      setAttributesSuccess("Attribute updated successfully");
    } catch (err) {
      console.error("Failed to update attribute:", err);
      setAttributesError("Failed to update attribute. Please try again.");
    }
  };

  const handleDeleteAttribute = async (key: string) => {
    if (!id || typeof id !== "string") return;

    try {
      setAttributesError(null);
      setAttributesSuccess(null);

      await deleteOrganizationAttribute(id, key);

      // Update local state
      const newAttributes = { ...attributes };

      delete newAttributes[key];
      setAttributes(newAttributes);

      setAttributesSuccess("Attribute deleted successfully");
    } catch (err) {
      console.error("Failed to delete attribute:", err);
      setAttributesError("Failed to delete attribute. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-danger-100 text-danger p-4 rounded-lg">{error}</div>
        <Button
          className="mt-4"
          variant="flat"
          onClick={() => router.push("/organizations")}
        >
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="light"
          onClick={() => router.push(`/organizations/${id}`)}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
      </div>

      {error && (
        <div className="bg-danger-100 text-danger p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-success-100 text-success p-4 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      <div className="bg-default-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">General Information</h2>

        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <Input
                fullWidth
                isRequired
                label="Organization Name"
                placeholder="Enter organization name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Textarea
                fullWidth
                label="Description"
                placeholder="Enter organization description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <Button color="primary" isLoading={isSaving} type="submit">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Organization Attributes Section */}
      <div className="bg-default-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Custom Attributes</h2>
        <p className="text-default-500 mb-4">
          Add custom attributes to your organization to store additional
          information.
        </p>

        {attributesError && (
          <div className="bg-danger-100 text-danger p-4 rounded-lg mb-6">
            {attributesError}
          </div>
        )}

        {attributesSuccess && (
          <div className="bg-success-100 text-success p-4 rounded-lg mb-6">
            {attributesSuccess}
          </div>
        )}

        {isLoadingAttributes ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Current Attributes */}
            {Object.keys(attributes).length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Current Attributes</h3>
                <div className="space-y-3">
                  {Object.entries(attributes).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 bg-default-100 rounded-lg"
                    >
                      <div className="flex-grow">
                        <p className="font-medium">{key}</p>
                        <p className="text-default-500">{String(value)}</p>
                      </div>
                      <Button
                        isIconOnly
                        color="danger"
                        variant="light"
                        onClick={() => handleDeleteAttribute(key)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-default-500 italic mb-6">
                No attributes defined yet.
              </div>
            )}

            {/* Add New Attribute Form */}
            <div>
              <h3 className="text-lg font-medium mb-3">Add New Attribute</h3>
              <form className="space-y-4" onSubmit={handleAddAttribute}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    fullWidth
                    isRequired
                    label="Attribute Key"
                    placeholder="Enter key"
                    value={newAttributeKey}
                    onChange={(e) => setNewAttributeKey(e.target.value)}
                  />
                  <Input
                    fullWidth
                    label="Attribute Value"
                    placeholder="Enter value"
                    value={newAttributeValue}
                    onChange={(e) => setNewAttributeValue(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    color="primary"
                    startContent={<PlusIcon size={16} />}
                    type="submit"
                  >
                    Add Attribute
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <div className="bg-danger-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
        <p className="text-default-500 mb-4">
          Once you delete an organization, there is no going back. Please be
          certain.
        </p>

        <Button color="danger" isLoading={isDeleting} onClick={handleDelete}>
          Delete Organization
        </Button>
      </div>
    </div>
  );
}

OrganizationSettingsPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
