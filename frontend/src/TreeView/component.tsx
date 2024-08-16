import { NodeOut } from "@/client";
import {
  FixedSizeNodeData,
  FixedSizeNodePublicState,
  TreeWalkerValue,
  TreeWalker,
  FixedSizeTree,
} from "react-vtree";
import { NodeComponentProps } from "react-vtree/dist/es/Tree";
import { useMeasure, useSet } from "@react-hookz/web";
import { ChevronRight, ChevronDown, HourglassIcon } from "lucide-react";

import { ParentId, useChildrenQuery } from "./query";
import { ReactNode, useCallback } from "react";

const ITEM_SIZE = 30;

interface NodeData extends FixedSizeNodeData {
  model: NodeOut;
  downloaded: boolean;
  onToggle: (id: number, isOpen: boolean) => void;
}

function makeNodeData(
  model: NodeOut,
  childrenQuery: object | undefined,
  onToggle: (id: number, isOpen: boolean) => void
): TreeWalkerValue<NodeData> {
  return {
    data: {
      id: model.id.toString(),
      model,
      isOpenByDefault: false,
      downloaded: !!childrenQuery,
      onToggle,
    },
  };
}

function getDropdownIcon(isOpen: boolean, downloaded: boolean): ReactNode {
  if (isOpen) {
    return downloaded ? <ChevronDown /> : <HourglassIcon />;
  } else {
    return <ChevronRight />;
  }
}

function TreeeNode({
  data: { model, downloaded, onToggle },
  isOpen,
  style,
  setOpen,
}: NodeComponentProps<NodeData, FixedSizeNodePublicState<NodeData>>) {
  return (
    <div
      className="flex items-center"
      style={{ ...style, paddingLeft: `${model.depth * 2}em` }}
    >
      {model.has_children && (
        <button
          onClick={() => {
            const newState = !isOpen;
            setOpen(newState);
            onToggle(model.id, newState);
          }}
        >
          {getDropdownIcon(isOpen, downloaded)}
        </button>
      )}
      <div>{model.title}</div>
    </div>
  );
}

export default function TreeView() {
  const openedNodeIds = useSet<ParentId>(["root"]);
  const nodeChildren = useChildrenQuery(openedNodeIds);

  const onNodeToggle = useCallback((id: number, isOpen: boolean) => {
    if (isOpen) {
      openedNodeIds.add(id);
    } else {
      openedNodeIds.delete(id);
    }
  }, []);

  const treeWalker = useCallback(
    function* treeWalker(): ReturnType<TreeWalker<NodeData>> {
      if (!nodeChildren.root.data) {
        return;
      }

      for (const node of nodeChildren.root.data) {
        yield makeNodeData(node, nodeChildren[node.id], onNodeToggle);
      }

      // Define each node's children
      while (true) {
        const parentMeta = yield;
        const children = nodeChildren[parentMeta.data.model.id];

        if (children && children.data) {
          for (const node of children.data) {
            yield makeNodeData(node, nodeChildren[node.id], onNodeToggle);
          }
        }
      }
    },
    [nodeChildren]
  );
  // FixedSizeTree with 0 nodes will throw an error
  const hasAtLeastOneNode =
    nodeChildren.root.data && nodeChildren.root.data.length > 0;

  const [measures, measureRef] = useMeasure<HTMLDivElement>();

  return (
    <div className="h-full w-full" ref={measureRef}>
      {hasAtLeastOneNode && (
        <FixedSizeTree
          treeWalker={treeWalker}
          itemSize={ITEM_SIZE}
          width="100%"
          height={measures?.height ?? 0}
          async={true}
        >
          {TreeeNode}
        </FixedSizeTree>
      )}
    </div>
  );
}
