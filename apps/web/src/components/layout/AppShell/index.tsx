import type { PropsWithChildren } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

export default function AppShell({
  children,
}: PropsWithChildren) {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        <Topbar />

        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  );
}
