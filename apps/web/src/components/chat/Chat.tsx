export default function Chat() {
  return (
    <section className="flex h-[340px] flex-col border-b border-zinc-800 bg-[#0d0d0f]">

      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold">
          AI Director
        </h2>

        <span className="rounded bg-emerald-600 px-2 py-1 text-xs">
          Gemini
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">

        <div className="rounded-lg bg-zinc-800 p-3">
          <div className="mb-1 text-xs text-cyan-400">
            USER
          </div>

          <p className="text-sm">
            Build authentication system.
          </p>
        </div>

        <div className="rounded-lg bg-[#162032] p-3">
          <div className="mb-1 text-xs text-emerald-400">
            KEMET AI
          </div>

          <p className="text-sm leading-7 text-zinc-200">
            Planner finished.
            <br />
            Architecture generated.
            <br />
            Frontend generation started...
          </p>
        </div>

      </div>

      <div className="border-t border-zinc-800 p-3">

        <div className="flex gap-2">

          <input
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            placeholder="Ask Kemet AI..."
          />

          <button className="rounded bg-cyan-600 px-5 text-sm font-medium hover:bg-cyan-500">
            Send
          </button>

        </div>

      </div>

    </section>
  );
}
