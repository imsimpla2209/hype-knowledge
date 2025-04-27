import { authController } from './controllers/auth.controller';
import { authenticate, requireAdmin } from './middleware/auth.middleware';

// Export auth components
export { authController, authenticate, requireAdmin };
