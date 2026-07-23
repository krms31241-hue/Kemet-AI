export default function Terminal() {
  return (
    <section className="h-56 border-t border-zinc-800 bg-black">

      <div className="border-b border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400">
        TERMINAL
      </div>

      <pre className="overflow-auto p-4 text-xs leading-6 text-emerald-400">
{`$ pnpm build

✓ Planning completed
✓ Backend completed
✓ Frontend completed
✓ Reviewer passed
✓ Documentation generated

Ready.`}
      </pre>

    </section>
  );
}
