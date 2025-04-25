import { NextApiRequest, NextApiResponse } from 'next';
import { publicAxiosInstance } from '@/lib/axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  const { organization_id } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid token' });
  }

  try {
    // Prepare request data
    const requestData = organization_id ? { organization_id } : {};
    
    // Forward the request to the backend API using the public axios instance
    const response = await publicAxiosInstance.post(`/invitations/${token}/accept`, requestData);
    
    // If no data is returned, something went wrong
    if (!response.data || !response.data.data) {
      return res.status(400).json({ message: 'Failed to accept invitation' });
    }
    
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Failed to accept invitation:', error);
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to accept invitation';
    return res.status(statusCode).json({ message });
  }
} 