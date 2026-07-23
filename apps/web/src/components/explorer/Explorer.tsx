const files = [
  "src",
  "components",
  "pages",
  "hooks",
  "services",
  "store",
  "App.tsx",
  "main.tsx",
  "package.json"
];

export default function Explorer() {
  return (
    <aside className="bg-zinc-900 border-r border-zinc-800 h-full overflow-auto">
      <div className="px-4 py-3 border-b border-zinc-800 font-semibold">
        Explorer
      </div>

      <div className="p-2">
        {files.map((file) => (
          <div
            key={file}
            className="px-3 py-2 rounded hover:bg-zinc-800 cursor-pointer text-sm"
          >
            {file}
          </div>
        ))}
      </div>
    </aside>
  );
}
