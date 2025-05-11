import { NextApiRequest, NextApiResponse } from "next";

import { publicAxiosInstance } from "@/lib/axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { token, organization_id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Invalid token" });
  }

  try {
    // Build the URL with the token
    let url = `/invitations/${token}`;

    // Append organization_id as a query parameter if provided
    if (organization_id) {
      url += `?organization_id=${organization_id}`;
    }

    // Forward the request to the backend API using the public axios instance
    const response = await publicAxiosInstance.get(url);

    // If no data is returned, the invitation probably doesn't exist
    if (!response.data || !response.data.data) {
      return res
        .status(404)
        .json({ message: "Invitation not found or expired" });
    }

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Failed to fetch invitation details:", error);
    const statusCode = error.response?.status || 500;
    const message =
      error.response?.data?.message || "Failed to fetch invitation details";

    return res.status(statusCode).json({ message });
  }
}
