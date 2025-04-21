import React, { useState, useRef, useCallback } from "react";
import { Button } from "@heroui/button";
import { getAvatarUrl } from "@/utils/avatar";

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onChange: (file: File | null) => void;
  value?: File | string;
  className?: string;
  buttonText?: string;
  previewClassName?: string;
  disabled?: boolean;
}

export const FileUpload = ({
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  onChange,
  value,
  className = "",
  buttonText = "Upload File",
  previewClassName = "",
  disabled = false,
}: FileUploadProps) => {
  const [error, setError] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial preview if value is a string (URL)
  React.useEffect(() => {
    if (typeof value === "string") {
      // Use our avatar URL formatter if this is an image file
      const formattedUrl = accept.includes('image/') ? getAvatarUrl(value) : value;
      setPreview(formattedUrl);
    } else if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [value, accept]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      const file = e.target.files?.[0];
      
      if (!file) {
        onChange(null);
        setPreview(null);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
        e.target.value = "";
        return;
      }

      // Validate file type
      const acceptedTypes = accept.split(",").map((type) => type.trim());
      const isValidType = acceptedTypes.some((type) => {
        if (type === "image/*") return file.type.startsWith("image/");
        return file.type === type;
      });

      if (!isValidType) {
        setError(`Invalid file type. Accepted types: ${accept}`);
        e.target.value = "";
        return;
      }

      onChange(file);
    },
    [accept, maxSize, onChange]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPreview(null);
    onChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleButtonClick();
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <div 
          className={`relative ${previewClassName}`}
          onClick={disabled ? undefined : handleButtonClick}
          onKeyDown={disabled ? undefined : handleKeyDown}
          tabIndex={disabled ? undefined : 0}
          role="button"
          aria-label="Change file"
        >
          {accept.includes("image/") && (
            <img
              src={preview}
              alt="File preview"
              className="w-full h-full object-cover rounded-md"
            />
          )}
          
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-danger rounded-full p-1 text-white hover:bg-danger-600"
              aria-label="Remove file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          variant="flat"
          className="w-full"
        >
          {buttonText}
        </Button>
      )}

      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FileUpload; 