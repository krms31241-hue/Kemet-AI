export default function Preview() {
  return (
    <section className="flex flex-1 flex-col border-t border-zinc-800 bg-[#0d0d0f]">

      <div className="border-b border-zinc-800 px-4 py-3 text-sm font-semibold">
        Live Preview
      </div>

      <div className="flex flex-1 items-center justify-center">

        <div className="flex h-[260px] w-[92%] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-500">
          Preview Window
        </div>

      </div>

    </section>
  );
}
