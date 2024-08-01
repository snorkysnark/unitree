import { Page_NodeOut_, getTreeApiTreeGet } from "@/client";
import { useMountEffect } from "@react-hookz/web";
import {
  QueryCache,
  QueryObserver,
  useInfiniteQuery,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ReactChild,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { List, AutoSizer, ListRowRenderer } from "react-virtualized";

const PAGE_SIZE = 100;

export default function TreePaginated() {
  const page1 = useQuery({
    queryKey: ["tree", 1],
    queryFn: () => getTreeApiTreeGet({ size: PAGE_SIZE, page: 1 }),
  });

  const queryClient = useQueryClient();
  const [onForceUpdate, forceUpdate] = useState({});

  useMountEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      const queryKey = event.query.queryKey;
      if (
        event.type === "updated" &&
        event.action.type === "success" &&
        Array.isArray(queryKey) &&
        queryKey.length > 0 &&
        queryKey[0] === "tree"
      ) {
        forceUpdate({});
      }
    });
  });

  const rowRenderer = useCallback<ListRowRenderer>(
    ({ key, style, index, isScrolling }) => {
      const pageNum = Math.floor(index / PAGE_SIZE) + 1;
      const pageData = queryClient.getQueryData(["tree", pageNum]) as
        | Page_NodeOut_
        | undefined;

      let rowContent: ReactElement | string = "";
      if (pageData) {
        const node = pageData.items[index % PAGE_SIZE];
        rowContent = (
          <div style={{ marginLeft: `${node.depth * 32}px` }}>
            {node.title ?? ""}
          </div>
        );
      } else if (!isScrolling) {
        queryClient.prefetchQuery({
          queryKey: ["tree", pageNum],
          queryFn: () => getTreeApiTreeGet({ size: PAGE_SIZE, page: pageNum }),
        });
      }

      return (
        <div key={key} style={style}>
          {rowContent}
        </div>
      );
    },
    [onForceUpdate]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AutoSizer>
        {({ width, height }) => (
          <List
            width={width}
            height={height}
            rowHeight={30}
            rowCount={page1.data?.total ?? 0}
            rowRenderer={rowRenderer}
          />
        )}
      </AutoSizer>
    </div>
  );
}
