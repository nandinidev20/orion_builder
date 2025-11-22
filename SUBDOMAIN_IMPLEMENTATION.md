# Subdomain Routing Implementation

This document summarizes the changes made to implement subdomain-based routing for the application.

## Overview
When a user logs in, the system now:
1. Returns the user's studio subdomain from the login API
2. Stores the subdomain in localStorage
3. Redirects the user to their subdomain URL (e.g., `ss.lvh.me:5173`)
4. Includes the subdomain in all subsequent API requests via headers

## Changes Made

### Backend Changes

#### 1. **server/services/authService.js**
- Updated `loginUser()` function to include `subdomain` in the returned user object
- The subdomain is now fetched from the studio document and sent back to the client

```javascript
return {
  message: 'Login successful',
  token,
  user: {
    id: user._id,
    email: user.email,
    role: user.role,
    studioId: user.studio._id,
    studioName: user.studio.name,
    subdomain: studio.subdomain  // Added this line
  }
};
```

### Frontend Changes

#### 2. **src/utils/subdomainHelper.js** (NEW FILE)
- Created utility functions for subdomain URL generation
- Functions included:
  - `getSubdomainURL(subdomain, path)` - Generate full URL with subdomain
  - `getCurrentSubdomain()` - Get current subdomain from localStorage
  - `isUserLoggedIn()` - Check if user has token and subdomain
  - `navigateWithSubdomain(path)` - Navigate to path with subdomain

#### 3. **src/contexts/AuthContext.jsx**
- Added `subdomain` state to the AuthContext
- Updated `login()` function to accept and store subdomain
- Updated `logout()` function to clear subdomain from localStorage
- Subdomain is now managed alongside token and user data

#### 4. **src/pages/Login.jsx**
- Added import for `getSubdomainURL` helper
- Stores subdomain in localStorage after successful login
- Redirects to subdomain URL using helper function:
  ```javascript
  const studioUrl = getSubdomainURL(subdomain, '/studio');
  window.location.href = studioUrl;
  ```

#### 5. **src/pages/Signup.jsx**
- Auto-generates subdomain from studio name
- Converts studio name to lowercase, replaces spaces with hyphens, removes special characters
- Sends subdomain in registration data

#### 6. **src/services/api.js**
- Updated axios interceptor to add subdomain as a header (`X-Subdomain`)
- Header is sent with every API request if subdomain is in localStorage
- Updated `registerStudio()` to include subdomain in form data

## How It Works

### Login Flow
1. User accesses `localhost:5173/login`
2. Enters credentials and submits
3. Login API (`POST /api/auth/login`) is called
4. Backend validates credentials and returns:
   - JWT token
   - User data including `subdomain`
5. Frontend stores in localStorage:
   - `token`
   - `subdomain`
   - Other user data
6. Frontend redirects to `ss.lvh.me:5173/studio` (where `ss` is the subdomain)

### Signup Flow
1. User enters studio name and other details
2. Frontend auto-generates subdomain from studio name
3. Registration data is sent with subdomain
4. Backend creates studio with the provided subdomain
5. User is redirected to verify email

### API Requests
All API requests now include:
- `Authorization: Bearer {token}` header
- `X-Subdomain: {subdomain}` header (if user is logged in)

## Environment Configuration
- **Development URL**: `lvh.me:5173` (localhost wildcard domain)
- **API Base URL**: `http://localhost:5000/api` (always the same)
- **Subdomain Format**: lowercase letters, numbers, hyphens (e.g., `my-studio`, `ss`)

## Testing the Implementation

### Local Development
1. Ensure `lvh.me` resolves to `localhost` (it should by default)
2. Access app via `http://localhost:5173` for login
3. After login, app redirects to `http://ss.lvh.me:5173` (where `ss` is subdomain)

### Verification
- Check localStorage for `subdomain` key after login
- Check network requests for `X-Subdomain` header
- Verify URL changes to subdomain after login

## Notes
- The subdomain is stored in localStorage and persists across browser sessions
- The subdomain is cleared on logout
- All authenticated API requests automatically include the subdomain header
- The implementation uses client-side routing, so accessing the subdomain URL directly should work as long as the frontend is properly served
