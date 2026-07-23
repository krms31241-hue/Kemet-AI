export default function Explorer() {
  return (
    <aside className="w-72 border-r border-zinc-800 bg-[#111113]">

      <div className="border-b border-zinc-800 p-4 text-sm font-semibold">
        Explorer
      </div>

      <div className="space-y-1 p-3">

        {[
          "src",
          "components",
          "layouts",
          "pages",
          "hooks",
          "store",
          "services",
          "assets",
          "public",
        ].map((item) => (
          <div
            key={item}
            className="cursor-pointer rounded px-2 py-2 text-sm hover:bg-zinc-800"
          >
            📁 {item}
          </div>
        ))}

      </div>

    </aside>
  );
}
