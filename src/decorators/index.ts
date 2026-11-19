import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { Container, Service } from 'typedi';

export const ROUTE_METADATA_KEY = Symbol('route_metadata');
export const CONTROLLER_METADATA_KEY = Symbol('controller_metadata');

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  methodName: string;
  middlewares: RequestHandler[];
}

/**
 * @Controller decorator
 * Marks a class as an HTTP controller, attaches the base path,
 * and registers it into the TypeDI dependency injection container.
 */
export function Controller(basePath: string = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(CONTROLLER_METADATA_KEY, basePath, target);
    Service()(target);
  };
}

/**
 * Re-export TypeDI decorators for dependency injection:
 * - @Inject() for field/property or parameter injection
 * - @Injectable() / @Service() to register classes into the DI container
 */
export { Inject, Service as Injectable, Service } from 'typedi';

/**
 * Factory for HTTP Method Decorators (@Get, @Post, @Put, @Delete, @Patch)
 */
function createRouteDecorator(method: HttpMethod) {
  return (path: string = '', ...middlewares: RequestHandler[]): any => {
    return (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor): any => {
      const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
      const normalizedPath = path === '' || path === '/' ? '/' : (path.startsWith('/') ? path : `/${path}`);
      routes.push({
        method,
        path: normalizedPath,
        methodName: String(propertyKey),
        middlewares,
      });
      Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
      return descriptor;
    };
  };
}

export const Get = createRouteDecorator('get');
export const Post = createRouteDecorator('post');
export const Put = createRouteDecorator('put');
export const Delete = createRouteDecorator('delete');
export const Patch = createRouteDecorator('patch');

/**
 * Creates an Express router from a decorated controller class using the DI container.
 */
export function createControllerRouter(controllerClass: any): Router {
  const router = Router();
  const instance = Container.get<any>(controllerClass);
  const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA_KEY, controllerClass) || [];

  // Sort routes so static paths (like /login) are registered before parameterized paths (like /:id)
  const sortedRoutes = [...routes].sort((a, b) => {
    const aHasParam = a.path.includes(':');
    const bHasParam = b.path.includes(':');
    if (aHasParam && !bHasParam) return 1;
    if (!aHasParam && bHasParam) return -1;
    return 0;
  });

  for (const route of sortedRoutes) {
    const handler = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await instance[route.methodName](req, res, next);
        // If the controller returned a value directly and didn't call res.json() / res.send()
        if (result !== undefined && !res.headersSent) {
          res.status(200).json({
            success: true,
            data: result,
          });
        }
      } catch (error) {
        next(error);
      }
    };

    (router as any)[route.method](route.path, ...route.middlewares, handler);
  }

  return router;
}
