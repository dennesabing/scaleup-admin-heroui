import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import AvatarUpload from "@/components/profile/AvatarUpload";
import { updateUserAvatarV2 } from "@/lib/userService";

// Create local mocks
const mockGetAvatarUrl = (url: string) => url;

// Mock the @/utils/avatar module
jest.mock(
  "@/utils/avatar",
  () => ({
    getAvatarUrl: (url: string) => url, // Just return the URL unchanged for testing
  }),
  { virtual: true },
);

// Mock child components to avoid image handling issues in tests
jest.mock("@/components/ui/ImageCropper", () => {
  return {
    __esModule: true,
    default: ({
      onCancel,
      onCropComplete,
    }: {
      onCancel: () => void;
      onCropComplete: (file: File) => void;
    }) => {
      return (
        <div data-testid="mock-image-cropper">
          <button data-testid="cancel-crop-button" onClick={() => onCancel()}>
            Cancel
          </button>
          <button
            data-testid="apply-crop-button"
            onClick={() =>
              onCropComplete(
                new File(["test"], "cropped-test.png", { type: "image/png" }),
              )
            }
          >
            Apply
          </button>
        </div>
      );
    },
  };
});

// Mock FileUpload component
jest.mock("@/components/ui/FileUpload", () => {
  return {
    __esModule: true,
    default: ({
      onChange,
      value,
      buttonText,
    }: {
      onChange: (file: File | null) => void;
      value?: File | string;
      buttonText?: string;
    }) => {
      return (
        <div data-testid="mock-file-upload">
          <input
            data-testid="file-input"
            type="file"
            onChange={(e) => {
              // Mock file selection
              if (e.target.files && e.target.files.length > 0) {
                onChange(e.target.files[0]);
              } else {
                onChange(null);
              }
            }}
          />
          <div>{buttonText || "Upload File"}</div>
          {value && typeof value === "string" && (
            <img alt="Preview" data-testid="preview-image" src={value} />
          )}
        </div>
      );
    },
  };
});

// Mock the userService
jest.mock("@/lib/userService", () => ({
  updateUserAvatarV2: jest.fn(),
}));

describe("AvatarUpload Component", () => {
  const mockAvatarUrl = "https://example.com/avatar.jpg";
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with existing avatar URL", () => {
    render(
      <AvatarUpload
        avatarUrl={mockAvatarUrl}
        onError={mockOnError}
        onSuccess={mockOnSuccess}
      />,
    );

    // Check FileUpload is rendered
    expect(screen.getByTestId("mock-file-upload")).toBeInTheDocument();
    expect(screen.getByText("Upload Avatar")).toBeInTheDocument();

    // Check preview is displayed
    expect(screen.getByTestId("preview-image")).toBeInTheDocument();
    expect(screen.getByTestId("preview-image")).toHaveAttribute(
      "src",
      mockAvatarUrl,
    );
  });

  it("shows cropper when file is selected", () => {
    render(<AvatarUpload onError={mockOnError} onSuccess={mockOnSuccess} />);

    // Create a test file
    const file = new File(["test"], "test.png", { type: "image/png" });

    // Simulate file selection
    const input = screen.getByTestId("file-input");
    const dataTransfer = { files: [file] };

    fireEvent.change(input, { target: dataTransfer });

    // Check if image cropper is displayed
    expect(screen.getByTestId("mock-image-cropper")).toBeInTheDocument();
  });

  it("cancels cropping and returns to upload view", () => {
    render(<AvatarUpload onError={mockOnError} onSuccess={mockOnSuccess} />);

    // Create a test file and select it
    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    // Check if image cropper is displayed
    expect(screen.getByTestId("mock-image-cropper")).toBeInTheDocument();

    // Click cancel button
    fireEvent.click(screen.getByTestId("cancel-crop-button"));

    // Check if we're back to the file upload view
    expect(screen.getByTestId("mock-file-upload")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-image-cropper")).not.toBeInTheDocument();
  });

  it("completes cropping and shows save button", async () => {
    render(<AvatarUpload onError={mockOnError} onSuccess={mockOnSuccess} />);

    // Create a test file and select it
    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    // Complete cropping
    fireEvent.click(screen.getByTestId("apply-crop-button"));

    // Check if we're back to the upload view with save button
    expect(screen.getByTestId("mock-file-upload")).toBeInTheDocument();
    expect(screen.getByText("Save Avatar")).toBeInTheDocument();
  });

  it("uploads avatar successfully", async () => {
    // Mock successful upload
    const newAvatarUrl = "https://example.com/new-avatar.jpg";

    (updateUserAvatarV2 as jest.Mock).mockResolvedValue(newAvatarUrl);

    const { getByText, findByText } = render(
      <AvatarUpload onError={mockOnError} onSuccess={mockOnSuccess} />,
    );

    // Create a test file and select it
    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    // Complete cropping
    fireEvent.click(screen.getByTestId("apply-crop-button"));

    // Click save button
    fireEvent.click(getByText("Save Avatar"));

    // Wait for success message (using findByText)
    const successMessage = await findByText("Avatar updated successfully");

    expect(successMessage).toBeInTheDocument();

    // Verify service and callback were called
    expect(updateUserAvatarV2).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalledWith(newAvatarUrl);
  });

  it("handles upload errors", async () => {
    // Mock error
    const errorMessage = "Upload failed";

    (updateUserAvatarV2 as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    render(<AvatarUpload onError={mockOnError} onSuccess={mockOnSuccess} />);

    // Create a test file and select it
    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    // Complete cropping
    fireEvent.click(screen.getByTestId("apply-crop-button"));

    // Click save button
    fireEvent.click(screen.getByText("Save Avatar"));

    // Wait for error handler to be called
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });

    // Success message should not appear
    expect(
      screen.queryByText("Avatar updated successfully"),
    ).not.toBeInTheDocument();
  });
});
