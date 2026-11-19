import { UserController, userController } from '../controllers/user.controller';
import { createControllerRouter } from '../decorators';
import { loginRateLimiter } from '../middlewares/rateLimiter';

// Automatically builds routes from @Get, @Post, @Put, @Delete decorators on UserController
const router = createControllerRouter(UserController);

// Alias route for auth
router.post('/auth', loginRateLimiter, userController.login);

export default router;
