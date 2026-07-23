import type { ReactNode } from "react";

import Sidebar from "../../components/sidebar/Sidebar";
import Topbar from "../../components/topbar/Topbar";
import Explorer from "../../components/explorer/Explorer";
import Editor from "../../components/editor/Editor";
import Chat from "../../components/chat/Chat";
import Terminal from "../../components/terminal/Terminal";
import Preview from "../../components/preview/Preview";

type Props = {
  children?: ReactNode;
};

export default function WorkspaceLayout({ children }: Props) {
  return (
    <div className="h-screen w-screen bg-zinc-950 text-white overflow-hidden">

      <div className="grid h-full grid-cols-[70px_280px_1fr_360px]">

        <Sidebar />

        <Explorer />

        <div className="grid grid-rows-[56px_1fr_220px]">

          <Topbar />

          <div className="overflow-hidden">
            {children ?? <Editor />}
          </div>

          <Terminal />

        </div>

        <div className="grid grid-rows-[1fr_320px]">

          <Chat />

          <Preview />

        </div>

      </div>

    </div>
  );
}
