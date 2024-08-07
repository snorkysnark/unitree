import { Page, getTreeApiTreeGet, getCountApiTreeCountGet } from "@/client";
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
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  List,
  AutoSizer,
  ListRowRenderer,
  InfiniteLoader,
} from "react-virtualized";

const PAGE_SIZE = 100;

export default function TreePaginated() {
  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ["tree"],
    queryFn: ({ pageParam }) =>
      getTreeApiTreeGet({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const countQuery = useQuery({
    queryKey: ["tree", "count"],
    queryFn: () => getCountApiTreeCountGet(),
  });
  const rowCount = countQuery.data ?? 0;

  const rowRenderer = useCallback<ListRowRenderer>(
    ({ key, index, style }) => {
      let content: ReactNode = "";

      const page = Math.floor(index / PAGE_SIZE);
      if (data && page < data.pages.length) {
        const node =
          data.pages[Math.floor(index / PAGE_SIZE)].data[index % PAGE_SIZE];

        content = node.title;
      }

      return (
        <div key={key} style={style}>
          {content}
        </div>
      );
    },
    [data]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AutoSizer>
        {({ width, height }) => (
          <InfiniteLoader
            isRowLoaded={({ index }) =>
              data ? index / PAGE_SIZE < data.pages.length : false
            }
            loadMoreRows={() => fetchNextPage()}
            rowCount={rowCount}
          >
            {({ onRowsRendered, registerChild }) => (
              <List
                width={width}
                height={height}
                onRowsRendered={onRowsRendered}
                ref={registerChild}
                rowCount={rowCount}
                rowHeight={20}
                rowRenderer={rowRenderer}
              />
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </div>
  );
}
