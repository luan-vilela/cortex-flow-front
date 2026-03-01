"use client";

interface PaletteItem {
  type: string;
  label: string;
  icon: string;
  iconBg: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "triggerNode",
    label: "Gatilho",
    icon: "▶",
    iconBg: "bg-emerald-500",
  },
  {
    type: "emailConnectionNode",
    label: "Conexão Gmail",
    icon: "🔌",
    iconBg: "bg-violet-500",
  },
  {
    type: "emailBodyNode",
    label: "Corpo do Email",
    icon: "📝",
    iconBg: "bg-blue-500",
  },
  {
    type: "sendEmailNode",
    label: "Enviar Email",
    icon: "📨",
    iconBg: "bg-orange-500",
  },
];

function DraggableNode({ item }: { item: PaletteItem }) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/cortex-node-type", item.type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-gray-50 group"
    >
      {/* Icon block */}
      <div
        className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center text-white text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
      >
        {item.icon}
      </div>
      {/* Label */}
      <span className="text-sm font-medium text-gray-700 leading-none">
        {item.label}
      </span>
    </div>
  );
}

export default function NodePalette() {
  return (
    <aside className="w-48 border-l border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Nodes
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {PALETTE_ITEMS.map((item) => (
          <DraggableNode key={item.type} item={item} />
        ))}
      </div>
    </aside>
  );
}
