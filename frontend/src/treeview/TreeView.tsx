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

function createIndentLines(nodes: NodeOut[], startingDepth: number = 1) {
  const lines: IndentLine[] = [];

  const linesGen = createIndentLinesAtDepth(nodes, startingDepth);
  let current = linesGen.next();
  while (!current.done) {
    lines.push(current.value);
    current = linesGen.next();
  }
  const maxDepth = current.value;

  for (let depth = startingDepth + 1; depth <= maxDepth; depth++) {
    lines.push(...createIndentLinesAtDepth(nodes, depth));
  }

  return lines;
}

export default function TreeView({
  nodes,
  startingDepth = 0,
}: {
  nodes: NodeOut[];
  startingDepth?: number;
}) {
  const indentLines = createIndentLines(nodes, startingDepth);

  return (
    <div className="relative">
      {nodes.map((node) => (
        <div
          key={node.id}
          style={{ marginLeft: `${(node.depth - startingDepth) * 2}rem` }}
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
            left: `${(line.depth - startingDepth) * 2 + 1}rem`,
            height: `${line.length * 2}rem`,
          }}
          className="absolute border-solid, border-2 border-l-gray-400"
        />
      ))}
    </div>
  );
}
