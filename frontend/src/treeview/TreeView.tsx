import { NodeOut } from "@/client";
import { useMemo } from "react";

interface IndentLine {
  row: number;
  depth: number;
  length: number;
}

function* createIndentLinesAtDepth(
  nodes: NodeOut[],
  depth: number
): Generator<IndentLine, number> {
  let maxDepth = 0;

  let currentLine: IndentLine = { row: 0, length: 0, depth };
  for (let row = 0; row < nodes.length; row++) {
    const node = nodes[row];

    if (node.depth <= depth) {
      if (currentLine.length > 0) yield currentLine;
      currentLine = { row: row + 1, length: 0, depth };
    } else {
      currentLine.length += 1;
    }

    if (node.depth > maxDepth) maxDepth = node.depth;
  }
  if (currentLine.length > 0) yield currentLine;

  return maxDepth;
}

function createIndentLines(nodes: NodeOut[]) {
  const lines: IndentLine[] = [];

  const linesGen = createIndentLinesAtDepth(nodes, 0);
  let current = linesGen.next();
  while (!current.done) {
    lines.push(current.value);
    current = linesGen.next();
  }
  const maxDepth = current.value;

  for (let depth = 1; depth <= maxDepth; depth++) {
    lines.push(...createIndentLinesAtDepth(nodes, depth));
  }

  return lines;
}

export default function TreeView({ nodes }: { nodes: NodeOut[] }) {
  const indentLines = useMemo(() => createIndentLines(nodes), [nodes]);
  console.log(indentLines);

  return (
    <div className="relative">
      {nodes.map((node) => (
        <div
          key={node.id}
          style={{ marginLeft: `${node.depth * 2}rem` }}
          className="hover:bg-gray-100 h-8 px-2 align-middle select-none text-nowrap"
        >
          {node.title}
        </div>
      ))}

      {indentLines.map((line, i) => (
        <div
          key={i}
          style={{
            top: `${line.row * 2}rem`,
            left: `${line.depth * 2 + 1}rem`,
            height: `${line.length * 2}rem`,
          }}
          className="absolute border-solid, border-2 border-l-gray-400"
        />
      ))}
    </div>
  );
}
