# Changelog for Server Port Configuration

## [0.5.1] - Patch Release - Server Configuration Update

### Changed
- Updated server configuration to use port 3000 by default instead of port 443
- Modified `package.json` dev scripts to explicitly use port 3000
- Enhanced `server.js` to properly parse command line arguments for port settings
- Added command line argument support for `--port=3000` parameter

### Improved
- Better developer experience with standard development port (3000)
- More explicit port configuration in development scripts
- Easier setup for new developers with simpler port configuration
- Improved command line argument parsing for flexible port settings

### Fixed
- Critical cookie domain bug that prevented cookies from being set in the browser
- Incorrect cookie domain format including port number (e.g., domain=scaleup-admin.local:3000)
- CSRF token cookie issues by properly formatting cookie domain without port number
- Added comprehensive cookie handling for local development:
  - Fixed SameSite attribute for cross-domain cookies in local development
  - Added proper CORS headers for API requests
  - Ensured consistent domain parameter across all cookies
  - Added support for OPTIONS requests required by CORS preflight checks 