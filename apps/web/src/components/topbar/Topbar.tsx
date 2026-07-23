export default function Topbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between">
      <div className="text-lg font-semibold">
        Kemet AI Workspace
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500">
          Run
        </button>

        <button className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500">
          Build
        </button>
      </div>
    </header>
  );
}
