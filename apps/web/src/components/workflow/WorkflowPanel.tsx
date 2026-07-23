export default function WorkflowPanel() {
  return (
    <section className="border-t border-zinc-800 bg-[#111113]">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-200">
          Workflow
        </h2>

        <button className="rounded bg-cyan-600 px-2 py-1 text-xs font-medium hover:bg-cyan-500">
          New
        </button>
      </div>

      <div className="space-y-2 px-3 pb-3">

        <div className="rounded border border-zinc-700 bg-zinc-900 p-3">
          <div className="text-sm font-medium">
            Idea
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Waiting...
          </div>
        </div>

        <div className="rounded border border-zinc-700 bg-zinc-900 p-3">
          <div className="text-sm font-medium">
            Planning
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Waiting...
          </div>
        </div>

        <div className="rounded border border-zinc-700 bg-zinc-900 p-3">
          <div className="text-sm font-medium">
            Generation
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Waiting...
          </div>
        </div>

      </div>
    </section>
  );
}
