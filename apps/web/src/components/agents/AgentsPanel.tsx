export default function AgentsPanel() {
  return (
    <section className="border-t border-zinc-800 bg-[#0f0f11]">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-200">
          AI Agents
        </h2>
      </div>

      <div className="space-y-2 px-3 pb-3">

        {[
          "Planner",
          "Architect",
          "Frontend",
          "Backend",
          "Reviewer",
        ].map((agent) => (
          <div
            key={agent}
            className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          >
            <span className="text-sm">
              {agent}
            </span>

            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        ))}

      </div>
    </section>
  );
}
