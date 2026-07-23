export default function Editor() {
  return (
    <main className="flex flex-1 flex-col bg-[#0b0b0d]">

      <div className="flex h-11 items-center border-b border-zinc-800 bg-[#121214]">

        {[
          "App.tsx",
          "Sidebar.tsx",
          "Planner.ts",
        ].map((tab) => (
          <button
            key={tab}
            className="border-r border-zinc-800 px-4 py-3 text-sm hover:bg-zinc-800"
          >
            {tab}
          </button>
        ))}

      </div>

      <div className="flex-1 overflow-auto">

<pre className="min-h-full p-6 text-sm leading-7 text-zinc-300">
{`// Kemet AI

export async function buildProject() {

  const planner = await AI.plan();

  const architecture = await AI.architect(planner);

  const frontend = await AI.frontend(architecture);

  const backend = await AI.backend(architecture);

  const reviewer = await AI.review();

  return reviewer.output;

}
`}
</pre>

      </div>

    </main>
  );
}
