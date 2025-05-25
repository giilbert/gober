import { createRoute, Outlet } from "@tanstack/react-router";
import { rootRoute } from ".";
import { MafProvider } from "../components/maf-provider";

export const layoutRoute = createRoute({
  id: "_layout",
  getParentRoute: () => rootRoute,
  component: () => (
    <MafProvider>
      <Outlet />
    </MafProvider>
  ),
});
