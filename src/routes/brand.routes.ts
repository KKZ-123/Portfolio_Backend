import { BrandController } from '../controllers/brand.controller';
import { createControllerRouter } from '../decorators';

// Automatically builds routes from @Get, @Post decorators on BrandController
const router = createControllerRouter(BrandController);

export default router;

