import { createRootRoute, createRouter } from "@tanstack/react-router";
import { layoutRoute } from "./layout";
import { adminRoute } from "./admin";
import { homeRoute } from "./home";

export const rootRoute = createRootRoute();

export const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([homeRoute, adminRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
