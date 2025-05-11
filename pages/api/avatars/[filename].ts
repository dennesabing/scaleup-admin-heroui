import https from "https";

import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Create an https agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Reverse proxy for avatar images
 * This allows us to mask the backend URL and avoid CORS issues
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the filename from the URL parameter
    const { filename } = req.query;

    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ message: "Filename is required" });
    }

    // Construct the backend URL for the avatar
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://scaleup-api.local";
    const avatarUrl = `${backendUrl}/api/avatars/${filename}`;

    console.log("avatarUrl", avatarUrl);

    // Get the image from the backend with responseType 'arraybuffer' to handle binary data
    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
      // Forward authentication headers if present
      headers: req.headers.authorization
        ? { Authorization: req.headers.authorization }
        : {},
      // Use the https agent that ignores certificate errors
      httpsAgent,
    });

    // Set the correct content type based on file extension
    const contentType = getContentType(filename);

    res.setHeader("Content-Type", contentType);

    // Set cache control headers to optimize performance
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day

    // Return the image data
    return res.status(200).send(response.data);
  } catch (error) {
    console.error("Error proxying avatar:", error);

    // Check if it's a 404 from the backend
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    // Return a generic error for other issues
    return res.status(500).json({ message: "Error fetching avatar" });
  }
}

/**
 * Get the content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
