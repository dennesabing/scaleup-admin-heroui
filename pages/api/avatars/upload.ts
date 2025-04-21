import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Create an https agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Disable the default body parser to support multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Handles avatar upload requests and forwards them to the backend
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const { fields, files } = await parseForm(req);
    
    // Check that we have an avatar file
    const avatarFile = files.avatar?.[0] as formidable.File | undefined;
    if (!avatarFile) {
      return res.status(400).json({ message: 'Avatar file is required' });
    }

    // Create form data to send to the backend
    const formData = new FormData();
    
    // Add the avatar file
    const fileBuffer = fs.readFileSync(avatarFile.filepath);
    formData.append('avatar', new Blob([fileBuffer]), avatarFile.originalFilename || 'avatar.jpg');
    
    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://scaleup-api.local';
    const avatarEndpoint = `${backendUrl}/me/avatar`;
    const response = await axios.post(avatarEndpoint, formData, {
      headers: {
        ...req.headers.authorization ? { Authorization: req.headers.authorization as string } : {},
        'Content-Type': 'multipart/form-data',
      },
      httpsAgent, // Use the https agent that ignores certificate errors
    });

    // Return the backend response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error uploading avatar:', error);
    
    // Check specific error types
    if (axios.isAxiosError(error)) {
      // If we have an error from the backend, forward its status and message
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
    }
    
    // Return a generic error for other issues
    return res.status(500).json({ message: 'Error uploading avatar' });
  }
}

/**
 * Parse the multipart form data
 */
function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const options: formidable.Options = {
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    keepExtensions: true,
    filter: (part: formidable.Part) => {
      // Accept only image files
      if (part.name !== 'avatar') return false;
      
      return !!(
        part.mimetype?.includes('image/jpeg') ||
        part.mimetype?.includes('image/png') ||
        part.mimetype?.includes('image/gif') ||
        part.mimetype?.includes('image/webp')
      );
    },
  };

  return new Promise((resolve, reject) => {
    const form = formidable(options);
    
    form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
} 