import {
  ApiError,
  getTreeApiTreeGet,
  GetTreeApiTreeGetData,
  Page,
} from "@/client";
import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { useMeasure, usePrevious } from "@react-hookz/web";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { ReactNode, RefObject, useLayoutEffect, useRef, useState } from "react";

const PAGE_SIZE = 100;
const ITEM_HEIGHT = 25;

function TreeNode({
  index,
  style,
  data,
}: ListChildComponentProps<InfiniteData<Page> | undefined>) {
  let content: ReactNode = <></>;

  if (data && index >= 0) {
    const pageNum = Math.floor(index / PAGE_SIZE);
    if (pageNum < data.pages.length) {
      const localIndex = index % PAGE_SIZE;
      const node = data.pages[pageNum].data[localIndex];

      content = <>{node.title}</>;
      style = {
        ...style,
        paddingLeft: `${node.depth * 2}em`,
        borderTop: localIndex === 0 ? "2px solid" : undefined,
      };
    }
  }

  return (
    <div className="text-lg text-nowrap overflow-visible" style={style}>
      {content}
    </div>
  );
}

function TreeNodeWithOffset({
  index,
  ...rest
}: ListChildComponentProps<InfiniteData<Page> | undefined>) {
  return TreeNode({ index: index - PAGE_SIZE, ...rest });
}

function keepScrollPositionOnPageLoad({
  listRef,
  isFetchingPreviousPage,
  hasPreviousPage,
}: {
  listRef: RefObject<List>;
  isFetchingPreviousPage: boolean;
  hasPreviousPage: boolean;
}): (scrollOffset: number) => void {
  const [scrollOffset, setScrollOffset] = useState(0);
  const wasFetchingPreviousPage = usePrevious(isFetchingPreviousPage);

  useLayoutEffect(() => {
    if (
      listRef.current &&
      wasFetchingPreviousPage &&
      !isFetchingPreviousPage &&
      hasPreviousPage
    ) {
      listRef.current.scrollTo(scrollOffset + PAGE_SIZE * ITEM_HEIGHT);
    }
  }, [isFetchingPreviousPage, wasFetchingPreviousPage, hasPreviousPage]);

  return setScrollOffset;
}

function getBeforeCursor(page: Page): GetTreeApiTreeGetData | null {
  return page.before_cursor ? { beforeCursor: page.before_cursor } : null;
}

function getAfterCursor(page: Page): GetTreeApiTreeGetData | null {
  return page.after_cursor ? { afterCursor: page.after_cursor } : null;
}

export default function TreePaginated() {
  const {
    data: queryData,
    hasNextPage,
    fetchNextPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["tree"],
    queryFn: ({ pageParam }) =>
      getTreeApiTreeGet({ ...pageParam, limit: PAGE_SIZE }),
    initialPageParam: {},
    getPreviousPageParam: getBeforeCursor,
    getNextPageParam: getAfterCursor,
  }) as UseInfiniteQueryResult<
    InfiniteData<Page, GetTreeApiTreeGetData>,
    ApiError
  >;

  const listRef = useRef<List>(null);
  const saveScrollPosition = keepScrollPositionOnPageLoad({
    listRef,
    isFetchingPreviousPage,
    hasPreviousPage,
  });

  let pageCount = queryData?.pages.length ?? 1;
  if (hasPreviousPage) pageCount += 1;
  if (hasNextPage) pageCount += 1;

  const [measurements, measureRef] = useMeasure<HTMLDivElement>();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1" ref={measureRef}>
        <List
          width={measurements?.width ?? 0}
          height={measurements?.height ?? 0}
          itemSize={ITEM_HEIGHT}
          itemCount={pageCount * PAGE_SIZE}
          itemData={queryData}
          onScroll={({ scrollOffset }) => saveScrollPosition(scrollOffset)}
          ref={listRef}
        >
          {hasPreviousPage ? TreeNodeWithOffset : TreeNode}
        </List>
      </div>
      <div className="flex gap-2">
        <button className="bg-gray-400" onClick={() => fetchPreviousPage()}>
          Load Previous
        </button>
        <button className="bg-gray-400" onClick={() => fetchNextPage()}>
          Load Next
        </button>
        <button className="bg-gray-400" onClick={() => refetch()}>
          Refetch
        </button>
      </div>
    </div>
  );
}
