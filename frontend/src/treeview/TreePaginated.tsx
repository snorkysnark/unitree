import { useCallback, useEffect, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCountApiTreeCountGet, getTreeApiTreeGet } from "@/client";
import TreeView from "./TreeView";

function IconButton({ children, ...rest }: Parameters<typeof Button>[0]) {
  return (
    <Button variant="outline" size="icon" {...rest}>
      {children}
    </Button>
  );
}

export default function TreePaginated() {
  const [limitOption, setLimitOption] = useState("100");

  const limit = +limitOption;
  const [offset, setOffset] = useState(0);

  const queryClient = useQueryClient();

  const { data: tree } = useQuery({
    queryKey: ["tree", limit, offset],
    queryFn: () => {
      // query 1 extra item to check if next page exists
      return getTreeApiTreeGet({ limit: limit + 1, offset });
    },
    select: (items) => {
      let hasNextPage = false;
      if (items.length > limit) {
        items = items.slice(0, limit);
        hasNextPage = true;
      }

      return { items, hasNextPage };
    },
  });
  const { data: count, refetch: refetchCount } = useQuery({
    queryKey: ["count"],
    refetchOnWindowFocus: false,
    enabled: false,
    queryFn: getCountApiTreeCountGet,
  });

  useEffect(() => {
    // If on last page, we can compute count without query
    if (tree && !tree.hasNextPage && count === undefined) {
      queryClient.setQueryData(["count"], offset + tree.items.length);
    }
  }, [tree]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-scroll">
        {tree && <TreeView nodes={tree.items} />}
      </div>
      <div className="flex-shrink-0 flex-grow-0 p-2 flex items-center select-none">
        <IconButton disabled={offset === 0} onClick={() => setOffset(0)}>
          <ChevronFirst />
        </IconButton>
        <IconButton
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          <ChevronLeft />
        </IconButton>
        <Select value={limitOption} onValueChange={setLimitOption}>
          <SelectTrigger className="w-auto inline-flex">
            <SelectValue asChild>
              <span>
                {offset}-{offset + limit}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Page Size</SelectLabel>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="m-1">of</span>
        <Button variant="outline" onClick={() => refetchCount()}>
          {count ?? "COUNT"}
        </Button>
        <IconButton
          disabled={!tree?.hasNextPage}
          onClick={() => {
            let nextOffset = offset + limit;
            if (count !== undefined)
              nextOffset = Math.min(nextOffset, count - limit);

            setOffset(nextOffset);
          }}
        >
          <ChevronRight />
        </IconButton>
        <IconButton
          disabled={!tree?.hasNextPage}
          onClick={async () => {
            let theCount = count ?? (await refetchCount()).data!;
            setOffset(Math.max(0, theCount - limit));
          }}
        >
          <ChevronLast />
        </IconButton>
      </div>
    </div>
  );
}
