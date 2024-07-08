import { NodeOut } from "@/client";

export default function TreeView({ nodes }: { nodes: NodeOut[] }) {
  return (
    <div>
      {nodes.map((node) => (
        <div
          key={node.id}
          style={{ marginLeft: `${node.depth * 2}rem` }}
          className="hover:bg-gray-100 h-8 px-2 align-middle select-none text-nowrap"
        >
          {node.title}
        </div>
      ))}
    </div>
  );
}
