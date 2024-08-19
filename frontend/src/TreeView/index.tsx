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
  download(id: number): void;
}

function getDropdownIcon(isOpen: boolean, downloaded: boolean): ReactNode {
  if (isOpen) {
    return downloaded ? <ChevronDown /> : <HourglassIcon />;
  } else {
    return <ChevronRight />;
  }
}

function TreeeNode({
  data: { model, downloaded, download },
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
            if (newState) download(model.id);
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
  const requestedIds = useSet<ParentId>(["root"]);
  const nodeChildren = useChildrenQuery(requestedIds);

  const download = useCallback((id: number) => {
    if (!requestedIds.has(id)) {
      requestedIds.add(id);
    }
  }, []);

  const makeNodeData = useCallback(
    (model: NodeOut) =>
      ({
        data: {
          id: model.id.toString(),
          model,
          isOpenByDefault: false,
          downloaded: !!nodeChildren[model.id]?.data,
          download,
        },
      } as TreeWalkerValue<NodeData>),
    [nodeChildren]
  );

  const treeWalker = useCallback(
    function* treeWalker(): ReturnType<TreeWalker<NodeData>> {
      if (!nodeChildren.root.data) {
        return;
      }

      for (const model of nodeChildren.root.data) {
        yield makeNodeData(model);
      }

      // Define each node's children
      while (true) {
        const parentMeta = yield;
        const children = nodeChildren[parentMeta.data.model.id];

        if (children && children.data) {
          for (const model of children.data) {
            yield makeNodeData(model);
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
