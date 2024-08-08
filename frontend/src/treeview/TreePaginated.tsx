import { getTreeApiTreeGet, GetTreeApiTreeGetData, Page } from "@/client";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useMeasure } from "@react-hookz/web";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { ReactNode, useCallback } from "react";

const PAGE_SIZE = 100;

function TreeNode({
  index,
  style,
  data,
}: ListChildComponentProps<InfiniteData<Page> | undefined>) {
  let content: ReactNode = <></>;

  if (data) {
    const pageNum = Math.floor(index / PAGE_SIZE);
    if (pageNum < data.pages.length) {
      const localIndex = index % PAGE_SIZE;
      const node = data.pages[pageNum].data[localIndex];

      content = <>{node.title}</>;
      style = {
        ...style,
        paddingLeft: `${node.depth * 2}em`,
      };
    }
  }

  return (
    <div className="text-lg text-nowrap" style={style}>
      {content}
    </div>
  );
}

export default function TreePaginated() {
  const {
    data: queryData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["tree"],
    queryFn: ({ pageParam }) =>
      getTreeApiTreeGet({ ...pageParam, limit: PAGE_SIZE }),
    initialPageParam: {} as GetTreeApiTreeGetData,
    getPreviousPageParam: (firstPage) =>
      ({ beforeCursor: firstPage.before_cursor } as GetTreeApiTreeGetData),
    getNextPageParam: (lastPage) =>
      ({ afterCursor: lastPage.after_cursor } as GetTreeApiTreeGetData),
  });

  let pageCount = queryData?.pages.length ?? 1;
  if (hasNextPage) {
    pageCount += 1;
  }

  const [measurements, measureRef] = useMeasure<HTMLDivElement>();

  return (
    <div className="w-full h-full" ref={measureRef}>
      <List
        width={measurements?.width ?? 0}
        height={measurements?.height ?? 0}
        itemSize={25}
        itemCount={pageCount * PAGE_SIZE}
        itemData={queryData}
        onItemsRendered={({ visibleStopIndex }) => {
          const lastVisiblePage = Math.floor(visibleStopIndex / PAGE_SIZE);
          if (
            queryData &&
            lastVisiblePage >= queryData.pages.length &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            fetchNextPage();
          }
        }}
      >
        {TreeNode}
      </List>
    </div>
  );
}
