import { NodeIn } from "@/client";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

const randomName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
  });

export interface GenerateTreeParams {
  maxDepth: number;
  maxChildren: number;
  minChildren?: number;
}

export function generateTree(
  params: GenerateTreeParams,
  currentDepth: number = 0
): NodeIn {
  const { maxDepth, maxChildren, minChildren = 0 } = params;
  const node: NodeIn = { title: randomName(), children: [] };

  if (currentDepth < maxDepth) {
    const numChildren =
      minChildren + Math.round(Math.random() * (maxChildren - minChildren));

    for (let i = 0; i < numChildren; i++) {
      const child = generateTree(params, currentDepth + 1);
      node.children.push(child);
    }
  }

  return node;
}
