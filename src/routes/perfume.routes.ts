import { PerfumeController } from '../controllers/perfume.controller';
import { createControllerRouter } from '../decorators';

// Automatically builds routes from @Get, @Post decorators on PerfumeController
const router = createControllerRouter(PerfumeController);

export default router;

