# HTTP-Only Cookie Authentication - CHANGELOG

## Version: 1.0.2 (Patch Update)

### Date: 2024-06-29

### Summary
Added HTTPS development environment support for proper testing of HTTP-only cookie authentication and improved CSRF token handling.

### Changes

#### Features
- Added HTTPS development server support
- Created comprehensive HTTPS setup documentation
- Improved CSRF token handling with dedicated utilities

#### Updated Files
- `server.js`: 
  - Created custom HTTPS development server
  - Added support for multiple certificate formats
  - Added proper error handling and guidance

- `package.json`: 
  - Added `dev:https` script command

- `lib/csrf.ts`:
  - Created dedicated CSRF token utility
  - Added clean, production-ready token handling functions
  - Separated debugging functions from production code

- `.env.local.example`:
  - Added HTTPS-specific environment variables

#### Benefits
- Better local development environment for authentication testing
- Proper simulation of production HTTPS environment
- Improved CSRF token handling and management
- Simplified authentication debugging

## Version: 1.0.1 (Patch Update)

### Date: 2024-06-28

### Summary
Fixed CSRF token implementation for HTTP-only cookie authentication to resolve token mismatch errors.

### Changes

#### Bug Fixes
- Fixed CSRF token retrieval and application in API requests
- Added more robust error handling for CSRF-related issues
- Improved debugging capabilities for authentication issues

#### Updated Files
- `lib/axios.ts`: 
  - Added utility function to reliably extract CSRF token from cookies
  - Enhanced error reporting for CSRF-related errors
  - Improved interceptor reliability

- `lib/auth.ts`:
  - Fixed CSRF token retrieval for authentication endpoints
  - Added dedicated CSRF token handling with proper timing
  - Used explicit token passing in headers

- `pages/auth/login.tsx`:
  - Added CSRF token debugging capabilities
  - Improved error reporting for authentication errors
  - Added token refresh before login attempt

- `lib/csrf-debug.ts`:
  - Created new utility for CSRF token debugging and troubleshooting

### Benefits
- More reliable cross-domain cookie handling
- Improved developer experience for troubleshooting auth issues
- Better error messages for CSRF-related problems

### Known Issues
- Cookie SameSite policy requires frontend and backend to be on same domain
- Some browser security settings may block third-party cookies

## Version: 1.0.0 (Minor Update)

### Date: 2024-06-27

### Summary
Implemented HTTP-only cookie-based authentication to replace token-based authentication, enhancing security by preventing XSS attacks that could steal authentication tokens from localStorage.

### Changes

#### Security Updates
- Replaced JWT token storage in localStorage with HTTP-only cookies
- Added CSRF token handling for all non-GET requests
- Implemented secure authentication state management

#### Updated Files
- `lib/axios.ts`: 
  - Added support for withCredentials
  - Added CSRF token handling for non-GET requests
  - Updated authentication header handling

- `lib/auth.ts`:
  - Removed token storage logic from localStorage
  - Added CSRF cookie handling
  - Updated login/logout functions to use cookie-based authentication

- `lib/authMiddleware.ts`:
  - Updated auth validation to use cookie-based session
  - Removed token-based authentication logic

- `pages/auth/login.tsx`:
  - Updated login form to work with cookie-based authentication
  - Added better error handling for verification emails
  - Improved UI for verification email resending

- `layouts/admin.tsx`:
  - Updated logout handling to use async/await and proper error handling

- `hooks/useAuthState.tsx`:
  - Created new custom hook for simplified auth state management in components

#### Benefits
- Enhanced security against XSS attacks
- Simplified authentication state management
- Improved compliance with security best practices

### Breaking Changes
- Applications or services that depend on the token in localStorage must be updated
- API calls now require CSRF token and cookies

### Required Backend Configuration
The backend must have:
1. Same top-level domain for frontend and backend
2. Configured CORS with:
   - `supports_credentials` set to true
   - Proper allowed origins
3. Properly configured session domain
4. Sanctum stateful domains configuration

### Recommendations
- Add proper monitoring for auth-related errors
- Update local development setup to ensure frontend and backend share same top-level domain
- Update backend routes for csrf-cookie and logout endpoints 