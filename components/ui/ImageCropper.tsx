import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  image: File;
  aspectRatio?: number;
  onCancel: () => void;
  onCropComplete: (croppedFile: File) => void;
  minWidth?: number;
  minHeight?: number;
}

// Function to create a centered crop with a specific aspect ratio
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

// Function to get a canvas with the cropped image
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas dimensions to the cropped size
  canvas.width = crop.width;
  canvas.height = crop.height;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  // Convert the canvas to a Blob and then to a File
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      
      // Get the original filename and extension
      const fileExtension = fileName.split(".").pop();
      const newFileName = `cropped-${fileName}`;
      
      // Create a new File object
      const file = new File([blob], newFileName, {
        type: `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`,
      });
      
      resolve(file);
    }, "image/jpeg", 0.95);
  });
}

export const ImageCropper = ({
  image,
  aspectRatio = 1, // Default to square
  onCancel,
  onCropComplete,
  minWidth = 200,
  minHeight = 200,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  // Create an object URL for the image file
  useEffect(() => {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        const objectUrl = URL.createObjectURL(image);
        setImageSrc(objectUrl);
        
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (error) {
        console.error('Error creating object URL:', error);
        // Fallback for tests
        setImageSrc('mock-image-url');
      }
    } else {
      // Fallback for environments without URL.createObjectURL (like Jest)
      setImageSrc('mock-image-url');
    }
  }, [image]);

  // When the image loads, set up the initial crop
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  // Handle the crop completion
  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    
    setIsLoading(true);
    
    try {
      const croppedImage = await getCroppedImg(
        imgRef.current,
        completedCrop,
        image.name
      );
      
      // Check if the cropped image meets minimum dimensions
      const img = new Image();
      img.src = URL.createObjectURL(croppedImage);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        if (img.width < minWidth || img.height < minHeight) {
          alert(`Image must be at least ${minWidth}x${minHeight} pixels`);
          setIsLoading(false);
          return;
        }
        
        onCropComplete(croppedImage);
      };
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [completedCrop, image.name, minHeight, minWidth, onCropComplete]);

  // Handle slider change for zoom
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    
    if (imgRef.current && completedCrop) {
      const { width, height } = imgRef.current;
      
      // Calculate new crop dimensions based on zoom
      const newWidth = Math.min(width * (newZoom / 100), width);
      const newHeight = Math.min(height * (newZoom / 100), height);
      
      // Create a new centered crop with the new dimensions
      setCrop(centerCrop(
        {
          unit: "px",
          width: newWidth,
          height: newHeight,
          x: (width - newWidth) / 2,
          y: (height - newHeight) / 2,
        },
        width,
        height
      ));
    }
  };

  return (
    <div className="p-4 bg-background rounded-md border border-divider">
      <h3 className="text-md font-medium mb-4">Crop Your Image</h3>
      
      <div className="mb-4">
        <div className="flex justify-center mb-4">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c: Crop) => setCrop(c)}
              onComplete={(c: PixelCrop) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={aspectRatio === 1}
              keepSelection
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-h-80 max-w-full"
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="zoom" className="block text-sm font-medium mb-1">
            Zoom
          </label>
          <input
            id="zoom"
            type="range"
            min="10"
            max="100"
            step="1"
            defaultValue="100"
            onChange={handleZoomChange}
            className="w-full h-2 bg-content2 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <p className="text-sm text-default-500 mb-4">
          Drag to reposition. Resize the box to crop.
        </p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          onClick={onCancel} 
          variant="flat" 
          color="default"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCropComplete} 
          color="primary"
          isLoading={isLoading}
          disabled={!completedCrop}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default ImageCropper; 