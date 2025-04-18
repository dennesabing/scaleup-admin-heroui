# Configuring Laravel Backend for Custom Domains

When using HTTPS with custom domains like `scaleup-admin.local` for the frontend, you need to properly configure your Laravel backend to support CORS (Cross-Origin Resource Sharing) and Sanctum for cookie-based authentication.

## Required Backend Changes

### 1. Update CORS Configuration

Edit `config/cors.php` in your Laravel project:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'csrf', 'auth/*', 'me'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => [
        'https://scaleup-admin.local', 
        // For development with non-standard port (if needed)
        'https://scaleup-admin.local:3000',
        // Add any other frontend domains you need
    ],
    
    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true, // IMPORTANT: Must be true for cookies
];
```

### 2. Configure Sanctum

Edit `config/sanctum.php`:

```php
<?php

return [
    // ... other config
    
    'stateful' => [
        'scaleup-api.local',
        'localhost',
        'localhost:3000',
        'scaleup-admin.local',
        'scaleup-admin.local:3000',
        // ... any other domains
    ],
    
    // ...
    
    'prefix' => 'api',
    
    'domain' => '.local', // Use a shared parent domain for cookies
];
```

### 3. Update Session Configuration

Edit `config/session.php`:

```php
<?php

return [
    // ... other config
    
    'domain' => env('SESSION_DOMAIN', '.local'),
    
    'secure' => env('SESSION_SECURE_COOKIE', true),
    
    'same_site' => env('SESSION_SAME_SITE', 'lax'),
    
    // ... other config
];
```

### 4. Update Environment Variables

Edit your backend `.env` file:

```
APP_URL=https://scaleup-api.local
SANCTUM_STATEFUL_DOMAINS=scaleup-admin.local,scaleup-admin.local:3000,scaleup-api.local
SESSION_DOMAIN=.local
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

## Testing Your CORS Configuration

You can use the browser's developer tools to check if CORS is working properly:

1. Open your frontend application at `https://scaleup-admin.local`
2. Open the browser's developer tools (F12 or right-click > Inspect)
3. Go to the Network tab
4. Look for requests to your API and check:
   - The `Access-Control-Allow-Origin` header is present in the response
   - The `Access-Control-Allow-Credentials` header is set to `true`
   - The cookies are being sent with the requests

## Common Issues and Solutions

### Issue: "No 'Access-Control-Allow-Origin' header is present"

**Solution:**
- Verify your CORS configuration in `config/cors.php`
- Make sure the domain in the allowed_origins list is exactly the same as your frontend URL, including the protocol and port

### Issue: Cookies not being sent to the API

**Solution:**
- Ensure `supports_credentials` is set to `true` in CORS config
- Make sure the frontend is making requests with `withCredentials: true`
- Check that the cookie domain is set to a shared domain (e.g., `.local`)
- Verify that you're using HTTPS on both frontend and backend

### Issue: CSRF token mismatch

**Solution:**
- Ensure the frontend fetches the CSRF token before any POST/PUT/DELETE requests
- Check your browser's developer tools to confirm the CSRF cookie is present
- Make sure the frontend includes the CSRF token in the `X-XSRF-TOKEN` header

### Issue: Cannot access API in development

**Solution:**
- Make sure both domains are added to your hosts file
- Verify your API is running and accessible directly at `https://scaleup-api.local`
- Check if your SSL certificates are properly set up for both domains 