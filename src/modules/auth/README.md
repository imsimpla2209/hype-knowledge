# Auth Module

## Purpose
The Auth module provides flexible authentication and authorization services for the Hype-knowledge application. It supports multiple authentication methods (JWT, OAuth 2.0, and proxy auth) and manages user sessions securely.

## Features
- JWT-based authentication with refresh tokens
- OAuth 2.0 integration (Google)
- Proxy authentication for external systems
- Session management with Redis
- Access control and permission management
- Secure token handling with rotation and revocation

## Dependencies
- Passport.js: Authentication middleware
- jsonwebtoken: JWT creation and validation
- Redis: Token and session storage
- Winston: Logging
- Zod: Input validation

## API Endpoints
- `POST /api/auth/login`: Local authentication with username/password
- `GET /api/auth/oauth/google`: Initiate Google OAuth flow
- `GET /api/auth/oauth/google/callback`: Handle Google OAuth callback
- `POST /api/auth/token/refresh`: Refresh an access token
- `POST /api/auth/logout`: Revoke active tokens
- `POST /api/auth/proxy`: Authenticate using a proxy token from external system

## Configuration
The module requires the following environment variables:
- `JWT_SECRET`: Secret key for signing JWTs
- `JWT_ACCESS_EXPIRY`: Access token expiry time (e.g., '15m')
- `JWT_REFRESH_EXPIRY`: Refresh token expiry time (e.g., '7d')
- `OAUTH_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `OAUTH_GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `OAUTH_CALLBACK_URL`: Base URL for OAuth callbacks
- `REDIS_URL`: Redis connection string
- `PROXY_AUTH_SECRET`: Shared secret for proxy authentication

## Usage
The auth module provides middleware that can be used to protect routes:

```typescript
import { authMiddleware } from '@modules/auth';

// Protect a route with JWT authentication
router.get('/protected', authMiddleware.requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Require specific permissions
router.post('/admin', 
  authMiddleware.requireAuth, 
  authMiddleware.requirePermission('admin'),
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);
```

## Security Considerations
1. Access tokens are short-lived (15 minutes by default)
2. Refresh tokens are long-lived but can be revoked
3. All tokens are stored in Redis for validation and revocation
4. Failed authentication attempts are rate-limited
5. OAuth state parameter is validated to prevent CSRF attacks
6. Sensitive data is never logged

## Testing
The module includes comprehensive unit and integration tests covering all authentication methods. See the `tests/unit/auth.test.ts` and `tests/integration/auth.test.ts` files for examples.

## Auth Module (Mock Implementation)

This is a temporary mock implementation of the authentication module. In production, this would be replaced with a real authentication system.

### Mock Features

- Fake login that always succeeds (`POST /api/auth/login`)
- Fake token refresh (`POST /api/auth/refresh`)
- Fake logout (`POST /api/auth/logout`)
- Authentication middleware that always authenticates the request
- Authorization middleware for admin access

### Usage

#### Routes

```typescript
// Auth routes are already set up in src/routes/auth.routes.ts
```

#### Authentication Middleware

To protect routes with authentication:

```typescript
import { authenticate } from '../modules/auth';

// Apply to specific routes
router.get('/protected-route', authenticate, (req, res) => {
  // Access user via req.user
  res.json({ user: req.user });
});

// Or apply to all routes in a router
router.use(authenticate);
```

#### Authorization Middleware

To restrict routes to admin users:

```typescript
import { requireAdmin } from '../modules/auth';

router.get('/admin-only', requireAdmin, (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

### How Mock Auth Works

All authentication and authorization checks automatically succeed. The middleware adds a fake user object to the request:

```typescript
// Regular user from authenticate middleware
req.user = {
  id: 'mock-user-id',
  email: 'user@example.com',
  name: 'Mock User',
  role: 'user'
};

// Admin user from requireAdmin middleware
req.user = {
  id: 'mock-admin-id',
  email: 'admin@example.com',
  name: 'Mock Admin',
  role: 'admin'
};
```

### Future Implementation

Replace this mock implementation with real authentication using JWT, OAuth providers, or another auth system when needed. 