import { NodeOut } from "@/client";

export default function TreeView({ nodes }: { nodes: NodeOut[] }) {
  return (
    <div>
      {nodes.map((node) => (
        <div key={node.id} className="relative">
          <div
            style={{ marginLeft: `${node.depth * 2}rem` }}
            className="hover:bg-gray-100 h-8 px-2 align-middle select-none text-nowrap"
          >
            {Array.from({ length: node.depth }, (_, i) => i).map((depth) => (
              <div
                key={depth}
                className="absolute h-full border-solid border-2 border-l-gray-400"
                style={{ left: `${depth * 2 + 1}rem` }}
              />
            ))}

            {node.title}
          </div>
        </div>
      ))}
    </div>
  );
}
