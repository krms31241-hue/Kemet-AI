import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import Workspace from "../../components/layout/Workspace";

export default function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        <Topbar />
        <Workspace />
      </main>
    </div>
  );
}
