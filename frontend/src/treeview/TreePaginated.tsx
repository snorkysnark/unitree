import { useEffect, useState } from "react";
import { useMeasure } from "@react-hookz/web";
import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  LimitOffsetPage_NodeOut_,
  getTreeApiTreeGet,
} from "@/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shadcn/ui/pagination";
import { ApiErrorCard, Centered, Spinner } from "@/misc";
import TreeView from "./TreeView";

export default function TreePaginated() {
  const [offset, setOffset] = useState(0);
  const [measures, ref] = useMeasure<HTMLDivElement>();
  const [pageSize, setPageSize] = useState<number | null>(null);

  // Update page size when element resized
  useEffect(() => {
    if (measures) {
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );

      setPageSize(Math.floor(measures.height / (2 * rem)));
    }
  }, [measures]);

  const treeQuery = useQuery<LimitOffsetPage_NodeOut_, ApiError>({
    queryKey: ["tree", pageSize, offset],
    enabled: !!pageSize,
    queryFn: () => getTreeApiTreeGet({ limit: pageSize!, offset }),
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden" ref={ref}>
        {treeQuery.isLoading && (
          <Centered>
            <Spinner />
          </Centered>
        )}
        {treeQuery.error && (
          <Centered>
            <ApiErrorCard error={treeQuery.error} />
          </Centered>
        )}
        {treeQuery.data && <TreeView nodes={treeQuery.data.items} />}
      </div>
      <Pagination className="min-h-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className="cursor-pointer"
              onClick={() => {
                if (pageSize) setOffset(Math.max(0, offset - pageSize));
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className="cursor-pointer"
              onClick={() => {
                if (treeQuery.data && pageSize)
                  setOffset(
                    Math.min(
                      treeQuery.data.total! - pageSize,
                      offset + pageSize
                    )
                  );
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
