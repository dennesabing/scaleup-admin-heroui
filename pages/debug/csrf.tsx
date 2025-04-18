import { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';

export default function CSRFDebug() {
  const [cookies, setCookies] = useState<string>('');
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [csrfTokenDecoded, setCsrfTokenDecoded] = useState<string>('');
  const [manualToken, setManualToken] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('/auth/login');
  const [requestPayload, setRequestPayload] = useState<string>('{\n  "email": "admin@example.com",\n  "password": "password"\n}');
  const [debug, setDebug] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Get current cookies
    setCookies(document.cookie);
    
    // Get API URL
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || '');
    
    // Extract CSRF token from cookies
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    if (match) {
      const rawToken = match[2];
      setCsrfToken(rawToken);
      try {
        setCsrfTokenDecoded(decodeURIComponent(rawToken));
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const refreshToken = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await axios.get('/api/proxy/csrf-debug');
      setDebug(response.data);
      setCookies(document.cookie);
      
      // Extract CSRF token from cookies
      const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
      if (match) {
        const rawToken = match[2];
        setCsrfToken(rawToken);
        try {
          setCsrfTokenDecoded(decodeURIComponent(rawToken));
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setErrorMessage('Failed to refresh token: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const makeRequest = async () => {
    setLoading(true);
    setResult(null);
    setErrorMessage('');
    
    try {
      let payload = {};
      try {
        payload = JSON.parse(requestPayload);
      } catch (error) {
        throw new Error('Invalid JSON payload');
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      // Add CSRF token
      if (manualToken) {
        headers['X-XSRF-TOKEN'] = manualToken;
      } else if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }
      
      const response = await axios.post(
        `${apiUrl}${apiEndpoint}`, 
        payload, 
        { 
          headers,
          withCredentials: true
        }
      );
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
    } catch (error) {
      console.error('API request error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        setResult({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        setErrorMessage(`Request failed with status ${error.response.status}`);
      } else {
        setErrorMessage('Request failed: ' + (error instanceof Error ? error.message : String(error)));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>CSRF Debug Tool</title>
      </Head>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">CSRF Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Current State</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
              <div className="bg-gray-100 p-2 rounded">{apiUrl}</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Cookies</label>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{cookies}</pre>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">CSRF Token (Raw)</label>
              <div className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{csrfToken || 'No token found'}</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">CSRF Token (Decoded)</label>
              <div className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{csrfTokenDecoded || 'No token found'}</div>
            </div>
            
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={refreshToken}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh Token'}
            </button>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Make API Request</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
              <input 
                type="text" 
                value={apiEndpoint} 
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Payload (JSON)</label>
              <textarea 
                value={requestPayload} 
                onChange={(e) => setRequestPayload(e.target.value)}
                className="w-full p-2 border rounded font-mono"
                rows={5}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manual CSRF Token Override (Leave empty to use cookie token)
              </label>
              <input 
                type="text" 
                value={manualToken} 
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full p-2 border rounded font-mono text-xs"
                placeholder="Enter token manually..."
              />
            </div>
            
            <button 
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              onClick={makeRequest}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Make Request'}
            </button>
          </div>
        </div>
        
        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{errorMessage}</p>
          </div>
        )}
        
        {debug && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </div>
        )}
        
        {result && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">
              Response (Status: {result.status} {result.statusText})
            </h2>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
} 