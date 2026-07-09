import type { RouteObject } from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <DashboardPage />,
  },
];
