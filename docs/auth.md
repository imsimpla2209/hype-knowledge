# Authentication Documentation

This document details the authentication mechanisms used in the Hype Knowledge API.

## Overview

The Hype Knowledge API uses JSON Web Tokens (JWT) for authentication. This token-based system provides secure access to the API without requiring the client to store session information.

## Authentication Flow

1. **Registration**: Users create an account with email and password
2. **Login**: Users authenticate and receive access and refresh tokens
3. **API Access**: Authenticated requests include access token in header
4. **Token Refresh**: When access token expires, use refresh token to get new tokens
5. **Logout**: Invalidate tokens on the server

## Endpoints

### Register a New User

```
POST /api/auth/register
```

Register a new user with the system.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user-uuid",
  "message": "User registered successfully"
}
```

### Login

```
POST /api/auth/login
```

Authenticate a user and receive access and refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Refresh Token

```
POST /api/auth/refresh
```

Get a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Logout

```
POST /api/auth/logout
```

Invalidate the current tokens.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

## Token Usage

To authenticate API requests, include the access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Example with JavaScript fetch:
```javascript
const response = await fetch('https://your-api-hostname.com/api/templates', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Token Expiration and Refresh

Access tokens are valid for 15 minutes (900 seconds). When an access token expires, use the refresh token to get a new pair of tokens.

Client-side token refresh example:
```javascript
async function refreshToken(refreshToken) {
  const response = await fetch('https://your-api-hostname.com/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store new tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } else {
    // Token refresh failed, redirect to login
    window.location.href = '/login';
    return null;
  }
}
```

## Auto-refresh Strategy

It's recommended to implement auto-refresh logic in your client application:

```javascript
async function apiRequest(url, options = {}) {
  // Add auth header if not present
  if (!options.headers) {
    options.headers = {};
  }
  
  let accessToken = localStorage.getItem('accessToken');
  
  if (accessToken) {
    options.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  // Make the request
  let response = await fetch(url, options);
  
  // If unauthorized and we have a refresh token, try to refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      const newAccessToken = await refreshToken(refreshToken);
      
      if (newAccessToken) {
        // Update auth header with new token
        options.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the request
        return fetch(url, options);
      }
    }
    
    // If we get here, the refresh failed
    window.location.href = '/login';
  }
  
  return response;
}
```

## Security Considerations

1. **Store tokens securely**:
   - For web applications, use HttpOnly cookies for refresh tokens
   - Never store tokens in localStorage for production applications handling sensitive data
   - Consider using secure, encrypted storage options for mobile applications

2. **Implement CSRF protection** when using cookies

3. **Handle token compromises**:
   - Implement token revocation on password changes
   - Use short expiration times for access tokens
   - Implement rate limiting on authentication endpoints

4. **Enable Multi-Factor Authentication** for additional security (if available)

## Troubleshooting

Common authentication issues:

1. **"Invalid token" error**:
   - Token may have expired
   - Token may be malformed or tampered with
   - Check that you're using the correct token

2. **"Token expired" error**:
   - Use the refresh token to get a new access token
   - If refresh token is also expired, user must login again

3. **"Unauthorized" error on API calls**:
   - Ensure the Authorization header is properly formatted
   - Verify the access token is valid
   - Check that the user has the necessary permissions

4. **"Invalid refresh token" error**:
   - The refresh token may have expired or been invalidated
   - User must login again to get new tokens

## Next Steps

After authenticating, your client application can make requests to any of the protected API endpoints by including the access token in the request headers. See the API Reference for detailed information on available endpoints and their requirements. 