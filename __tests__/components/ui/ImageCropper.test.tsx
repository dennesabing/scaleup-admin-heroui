import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import ImageCropper from "@/components/ui/ImageCropper";

// Mock the canvas and blob operations
jest.mock("react-image-crop", () => {
  return {
    __esModule: true,
    default: (props: any) => {
      // Extract the children prop to render the image
      const { children, onChange, onComplete } = props;

      return (
        <div data-testid="mock-react-crop">
          {/* Pass a mocked event to the onComplete prop */}
          <button
            data-testid="mock-crop-complete"
            onClick={() => onComplete({ width: 100, height: 100, x: 0, y: 0 })}
          >
            Simulate Crop
          </button>
          {children}
        </div>
      );
    },
    centerCrop: jest.fn(),
    makeAspectCrop: jest.fn(),
  };
});

// Make sure URL object exists and mock createObjectURL
if (typeof URL === "undefined") {
  global.URL = {
    createObjectURL: jest.fn(() => "mock-url"),
    revokeObjectURL: jest.fn(),
  } as any;
} else {
  // Mock methods on existing URL object
  URL.createObjectURL = jest.fn(() => "mock-url");
  URL.revokeObjectURL = jest.fn();
}

// Mock canvas and context
const mockContext = {
  drawImage: jest.fn(),
};

const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  width: 0,
  height: 0,
  toBlob: jest.fn((callback) =>
    callback(new Blob(["mockBlob"], { type: "image/jpeg" })),
  ),
};

// Mock document.createElement only for canvas
const originalCreateElement = document.createElement.bind(document);

document.createElement = jest.fn((tagName: string) => {
  if (tagName === "canvas") {
    return mockCanvas as unknown as HTMLCanvasElement;
  }

  return originalCreateElement(tagName);
});

describe("ImageCropper Component", () => {
  const mockFile = new File(["mock"], "test.jpg", { type: "image/jpeg" });
  const mockOnCancel = jest.fn();
  const mockOnCropComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component correctly", () => {
    render(
      <ImageCropper
        image={mockFile}
        onCancel={mockOnCancel}
        onCropComplete={mockOnCropComplete}
      />,
    );

    // Check if component elements are rendered
    expect(screen.getByText("Crop Your Image")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom")).toBeInTheDocument();
    expect(screen.getByText("Apply")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    // Check if crop preview is set up
    expect(screen.getByAltText("Crop preview")).toBeInTheDocument();
    expect(screen.getByTestId("mock-react-crop")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <ImageCropper
        image={mockFile}
        onCancel={mockOnCancel}
        onCropComplete={mockOnCropComplete}
      />,
    );

    // Click the cancel button
    fireEvent.click(screen.getByText("Cancel"));

    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("shows appropriate instructions", () => {
    render(
      <ImageCropper
        image={mockFile}
        onCancel={mockOnCancel}
        onCropComplete={mockOnCropComplete}
      />,
    );

    expect(
      screen.getByText("Drag to reposition. Resize the box to crop."),
    ).toBeInTheDocument();
  });
});
