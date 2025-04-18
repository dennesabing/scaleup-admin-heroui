# Changelog for CSRF Token Fixes

## [0.5.2] - Patch Release - CSRF Authentication Fixes

### Added
- New API proxy endpoint at `/api/proxy/csrf` to solve cross-domain cookie issues
- Domain rewriting for CSRF cookies to ensure proper cookie domains
- SSL certificate validation bypass for local development
- Improved debugging and logging for CSRF token issues
- Multiple fallback mechanisms for CSRF token retrieval
- Preservation of original token format and encoding
- Advanced debugging tools and UI:
  - CSRF Debug page at `/debug/csrf` for interactive troubleshooting
  - CSRF Debug API at `/api/proxy/csrf-debug` for detailed token analysis
  - Multiple token format testing in authentication flows
- JavaScript-accessible cookies by removing HttpOnly flags

### Fixed
- Critical CSRF token mismatch issue that was preventing login functionality
- Cross-domain cookie access issues between different local domains
- Cookie domain mismatch between `.scaleup-api.local` and `scaleup-admin.local`
- SSL certificate validation errors with self-signed certificates
- CSRF token encoding/decoding issues causing token length discrepancies
- Token format preservation to maintain compatibility with Laravel's CSRF validation
- Added support for retrieving token from multiple sources (cookie, meta tag, response data)
- Added retry mechanism with multiple token formats for robust authentication
- HttpOnly cookie restrictions that prevented JavaScript from accessing cookies

### Changed
- Updated all CSRF token requests to use the new proxy endpoint
- Modified authentication functions to use the local proxy for token requests
- Reworked axios interceptors to use the new CSRF proxy
- Extended token handling to work even when cookies fail
- Improved token handling to maintain original encoding format
- Enhanced login mechanism to automatically try multiple token formats
- Added comprehensive debug mode for CSRF token troubleshooting
- Removed HttpOnly attributes from all cookies for JavaScript accessibility

### Technical Details
- Implemented cookie domain rewriting to handle domain mismatch
- Created a NextJS API route to proxy CSRF token requests
- Added HTTPS agent configuration to ignore SSL validation in development
- Added comprehensive error handling and debugging information
- Implemented multiple fallback mechanisms for token retrieval
- Preserved raw token value without unnecessary encoding/decoding
- Added automatic token format detection and handling
- Created user interface for manual CSRF token testing
- Ensured all cookies are accessible to JavaScript by removing HttpOnly flags

### Original
- Cookie domain handling to properly set and read cookies across domains
- CSRF token extraction from cookies instead of missing meta tags
- SameSite attribute for XSRF-TOKEN cookie to enable cross-origin requests
- Added automatic CSRF token refresh before authentication attempts
- Improved error handling and debugging for CSRF-related issues

### Original Changed
- Updated axios interceptors to automatically fetch CSRF tokens when missing
- Enhanced cookie header processing in the development server
- Implemented proper CORS headers for local development environment
- Added logging to help diagnose CSRF token issues

### Original Technical Details
- Fixed cookie domain format issues (removed port number from domain)
- Set SameSite=None for CSRF tokens when needed for cross-origin requests
- Added 100ms delay after fetching CSRF token to ensure cookie is set
- Implemented proper extraction of CSRF token from cookies
- Added secure flag to cookies with SameSite=None for Chrome compatibility 