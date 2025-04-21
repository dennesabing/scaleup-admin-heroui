import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select } from "../../components/ui/Select";
import { UserModel, UserProfile } from "@/lib/auth";
import { updateUserProfile } from "../../lib/userService";
import { 
  countries, 
  usStates, 
  timezones, 
  genders, 
  CountryOption, 
  StateOption, 
  TimezoneOption,
  GenderOption
} from "@/lib/constants";
import AvatarUpload from "./AvatarUpload";

interface ProfileSectionProps {
  user: UserModel;
  onError: (error: unknown) => void;
}

export function ProfileSection({ user, onError }: ProfileSectionProps) {
  // Form state
  const [profileForm, setProfileForm] = useState<{
    name: string;
    profile: UserProfile;
  }>({
    name: "",
    profile: {
      first_name: "",
      last_name: "",
      birthdate: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      timezone: "",
      phone: "",
    }
  });
  
  // Initial form state (for comparison)
  const [initialForm, setInitialForm] = useState<{
    name: string;
    profile: UserProfile;
  }>({
    name: "",
    profile: {
      first_name: "",
      last_name: "",
      birthdate: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      timezone: "",
      phone: "",
    }
  });
  
  // Loading and success states
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      const formData = {
        name: user.name || "",
        profile: {
          first_name: user.profile?.first_name || "",
          last_name: user.profile?.last_name || "",
          birthdate: user.profile?.birthdate || "",
          gender: user.profile?.gender || "",
          address: user.profile?.address || "",
          city: user.profile?.city || "",
          state: user.profile?.state || "",
          postal_code: user.profile?.postal_code || "",
          country: user.profile?.country || "",
          timezone: user.profile?.timezone || "",
          phone: user.profile?.phone || "",
        }
      };
      
      setProfileForm(formData);
      setInitialForm(formData);
    }
  }, [user]);
  
  // Check if form has changes
  const hasChanges = useMemo(() => {
    // Compare name field
    if (profileForm.name !== initialForm.name) return true;
    
    // Compare profile fields
    const currentProfile = profileForm.profile;
    const initialProfile = initialForm.profile;
    
    return Object.keys(currentProfile).some(key => {
      return currentProfile[key as keyof UserProfile] !== 
        initialProfile[key as keyof UserProfile];
    });
  }, [profileForm, initialForm]);
  
  // Check if country is US
  const isUS = profileForm.profile.country === "US";
  
  // Handle form changes for text inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "name") {
      setProfileForm((prev) => ({
        ...prev,
        [name]: value
      }));
    } else {
      setProfileForm((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [name]: value
        }
      }));
    }
  };
  
  // Handle select changes for dropdowns
  const handleSelectChange = (name: string, value: string): void => {
    setProfileForm((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [name]: value,
        // Reset state when country changes to non-US
        ...(name === "country" && value !== "US" ? { state: "" } : {})
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) return;
    
    setSuccess("");
    setIsLoading(true);
    
    try {
      console.log('Submitting profile data:', profileForm);
      await updateUserProfile(profileForm);
      setSuccess("Profile updated successfully");
      // Update initial form state to current state
      setInitialForm({ ...profileForm });
    } catch (err) {
      console.error('Error updating profile:', err);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar upload success
  const handleAvatarSuccess = (newAvatarUrl: string) => {
    // Update the form state with the new avatar URL
    setProfileForm((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        avatar_url: newAvatarUrl
      }
    }));
    
    // Show success message for the profile section
    setSuccess("Avatar updated successfully");
  };

  return (
    <div className="bg-background rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Profile Information</h2>
      <p className="text-default-500 mb-4">
        Update your account profile information.
      </p>
      
      {/* Avatar Upload */}
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4">Profile Photo</h3>
        <AvatarUpload
          avatarUrl={user.profile?.avatar_url}
          onSuccess={handleAvatarSuccess}
          onError={onError}
          className="mb-2"
        />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Personal Information Section */}
          <div className="border-b pb-5">
            <h3 className="text-md font-medium mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Display Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={profileForm.name}
                  onChange={handleChange}
                  required
                  placeholder="Your display name"
                  className="mt-1 w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={profileForm.profile.first_name}
                    onChange={handleChange}
                    placeholder="Your first name"
                    className="mt-1 w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={profileForm.profile.last_name}
                    onChange={handleChange}
                    placeholder="Your last name"
                    className="mt-1 w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium">
                    Birthdate
                  </label>
                  <Input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    value={profileForm.profile.birthdate}
                    onChange={handleChange}
                    className="mt-1 w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium">
                    Gender
                  </label>
                  <Select
                    id="gender"
                    value={profileForm.profile.gender}
                    onChange={(value: string) => handleSelectChange("gender", value)}
                    className="mt-1 w-full"
                  >
                    <option value="">Select gender</option>
                    {genders.map((option: GenderOption) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Address Section */}
          <div className="border-b pb-5">
            <h3 className="text-md font-medium mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium">
                  Street Address
                </label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={profileForm.profile.address}
                  onChange={handleChange}
                  placeholder="Your street address"
                  className="mt-1 w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium">
                    City
                  </label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={profileForm.profile.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    className="mt-1 w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium">
                    State/Province
                  </label>
                  {isUS ? (
                    <Select
                      id="state"
                      value={profileForm.profile.state}
                      onChange={(value: string) => handleSelectChange("state", value)}
                      className="mt-1 w-full"
                    >
                      <option value="">Select state</option>
                      {usStates.map((option: StateOption) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      value={profileForm.profile.state}
                      onChange={handleChange}
                      placeholder="Your state or province"
                      className="mt-1 w-full"
                    />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium">
                    Postal Code
                  </label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    value={profileForm.profile.postal_code}
                    onChange={handleChange}
                    placeholder="Your postal code"
                    className="mt-1 w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium">
                    Country
                  </label>
                  <Select
                    id="country"
                    value={profileForm.profile.country}
                    onChange={(value: string) => handleSelectChange("country", value)}
                    className="mt-1 w-full"
                  >
                    <option value="">Select country</option>
                    {countries.map((option: CountryOption) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Section */}
          <div>
            <h3 className="text-md font-medium mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profileForm.profile.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="mt-1 w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium">
                    Timezone
                  </label>
                  <Select
                    id="timezone"
                    value={profileForm.profile.timezone}
                    onChange={(value: string) => handleSelectChange("timezone", value)}
                    className="mt-1 w-full"
                  >
                    <option value="">Select timezone</option>
                    {timezones.map((option: TimezoneOption) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.offset})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {success && (
            <div className="rounded-md bg-success-50 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-success">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              type="submit"
              color={hasChanges ? "success" : "default"}
              isLoading={isLoading}
              disabled={isLoading || !hasChanges}
              className="ml-3"
            >
              {hasChanges ? "Save Changes" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 