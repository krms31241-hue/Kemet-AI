export default function Chat() {
  return (
    <section className="border-l border-zinc-800 border-b border-zinc-800 bg-zinc-950 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 font-semibold">
        AI Chat
      </div>

      <div className="flex-1 overflow-auto p-4 text-zinc-400">
        Ready...
      </div>

      <div className="p-3 border-t border-zinc-800">
        <input
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 outline-none"
          placeholder="Ask Kemet AI..."
        />
      </div>
    </section>
  );
}
