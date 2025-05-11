import { NextApiRequest, NextApiResponse } from "next";

import axiosInstance from "@/lib/axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { organization_id, token } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (
    !token ||
    typeof token !== "string" ||
    !organization_id ||
    typeof organization_id !== "string"
  ) {
    return res
      .status(400)
      .json({ message: "Invalid token or organization ID" });
  }

  try {
    // Forward the complete registration request to the backend API
    const response = await axiosInstance.post(
      `/invitations/${organization_id}/${token}/accept`,
      req.body,
    );

    // Return the response data to the client
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Failed to accept invitation with registration:", error);
    const statusCode = error.response?.status || 500;
    const message =
      error.response?.data?.message || "Failed to accept invitation";

    return res.status(statusCode).json({ message });
  }
}
