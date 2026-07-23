const items = [
  "🏠",
  "📁",
  "🤖",
  "🧠",
  "⚙️",
  "📊",
  "🧩",
  "👤"
];

export default function Sidebar() {
  return (
    <aside className="border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4 gap-4">
      {items.map((item) => (
        <button
          key={item}
          className="w-12 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center text-xl"
        >
          {item}
        </button>
      ))}
    </aside>
  );
}
