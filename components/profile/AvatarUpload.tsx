import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';
import { updateUserAvatarV2 } from '@/lib/userService';
import { Button } from '@heroui/button';
import Image from 'next/image';
import getCroppedImg from '@/utils/cropImage';
import FileUpload from "../ui/FileUpload";
import ImageCropper from "../ui/ImageCropper";

interface AvatarUploadProps {
  avatarUrl?: string;
  className?: string;
  onSuccess?: (newAvatarUrl: string) => void;
  onError?: (error: unknown) => void;
}

export const AvatarUpload = ({
  avatarUrl,
  className = "",
  onSuccess,
  onError,
}: AvatarUploadProps) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = useCallback((file: File | null) => {
    if (file) {
      setSelectedFile(file);
      setShowCropper(true);
    } else {
      setAvatarFile(null);
      setSelectedFile(null);
      setSuccess("");
    }
  }, []);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setSelectedFile(null);
  }, []);

  const handleCropComplete = useCallback((croppedFile: File) => {
    setAvatarFile(croppedFile);
    setShowCropper(false);
    setSuccess("");
  }, []);

  const handleUpload = async () => {
    if (!avatarFile) return;

    setIsUploading(true);
    setSuccess("");

    try {
      const newAvatarUrl = await updateUserAvatarV2(avatarFile);
      setSuccess("Avatar updated successfully");
      
      if (onSuccess) {
        onSuccess(newAvatarUrl);
      }
      
      // Clear the file after successful upload
      setAvatarFile(null);
    } catch (error) {
      if (onError) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const hasChanges = avatarFile !== null;

  // If cropper is active, show it
  if (showCropper && selectedFile) {
    return (
      <div className={className}>
        <ImageCropper
          image={selectedFile}
          aspectRatio={1} // Square aspect ratio for avatars
          onCancel={handleCropCancel}
          onCropComplete={handleCropComplete}
          minWidth={200}
          minHeight={200}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <FileUpload
        accept="image/jpeg,image/png,image/gif"
        maxSize={5 * 1024 * 1024} // 5MB
        onChange={handleFileChange}
        value={avatarFile || avatarUrl || ""}
        buttonText="Upload Avatar"
        previewClassName="w-32 h-32 rounded-full overflow-hidden border border-divider"
        disabled={isUploading}
      />
      
      {hasChanges && (
        <div className="mt-3">
          <Button
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={isUploading || !hasChanges}
            color="success"
            size="sm"
          >
            Save Avatar
          </Button>
        </div>
      )}
      
      {success && (
        <div className="mt-2 text-sm text-success">
          {success}
        </div>
      )}
    </div>
  );
};

export default AvatarUpload; 