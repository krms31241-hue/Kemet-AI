import Sidebar from "../../components/sidebar/Sidebar";
import Topbar from "../../components/topbar/Topbar";
import Explorer from "../../components/explorer/Explorer";
import Editor from "../../components/editor/Editor";
import Chat from "../../components/chat/Chat";
import Terminal from "../../components/terminal/Terminal";
import Preview from "../../components/preview/Preview";
import WorkflowPanel from "../../components/workflow/WorkflowPanel";
import AgentsPanel from "../../components/agents/AgentsPanel";

export default function WorkspaceLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b] text-white">
      <div className="flex h-full">

        <Sidebar />

        <div className="flex flex-1 flex-col">

          <Topbar />

          <div className="flex flex-1 overflow-hidden">

            <Explorer />

            <div className="flex flex-1 flex-col">

              <Editor />

              <Terminal />

            </div>

            <div className="flex w-[430px] flex-col border-l border-zinc-800">

              <Chat />

              <WorkflowPanel />

              <AgentsPanel />

              <Preview />

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
