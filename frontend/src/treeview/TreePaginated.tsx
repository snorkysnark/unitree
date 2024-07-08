import { useCallback, useEffect, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Infinity,
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
import { Input } from "@/shadcn/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCountApiTreeCountGet, getTreeApiTreeGet } from "@/client";
import TreeView from "./TreeView";
import { Separator } from "@/shadcn/ui/separator";

function IconButton({ children, ...rest }: Parameters<typeof Button>[0]) {
  return (
    <Button variant="outline" size="icon" {...rest}>
      {children}
    </Button>
  );
}

export default function TreePaginated() {
  const [limitOption, setLimitOption] = useState("100");

  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const queryClient = useQueryClient();

  const [minDepth, setMinDepth] = useState(0);
  const [maxDepth, setMaxDepth] = useState<number | null>(null);

  const { data: tree } = useQuery({
    queryKey: ["tree", limit, offset, minDepth, maxDepth],
    queryFn: () => {
      // query 1 extra item to check if next page exists
      return getTreeApiTreeGet({
        limit: limit + 1,
        offset,
        minDepth,
        maxDepth: maxDepth ?? undefined,
      });
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

  // For limit=All, fetch the count
  useEffect(() => {
    if (limitOption === "all") {
      refetchCount().then((result) => {
        if (result.data !== undefined) setLimit(result.data);
      });
    } else {
      setLimit(+limitOption);
    }
  }, [limitOption]);

  useEffect(() => {
    // If on last page, we can compute count without query
    if (tree && !tree.hasNextPage && count === undefined) {
      queryClient.setQueryData(["count"], offset + tree.items.length);
    }
  }, [tree]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-scroll">
        {tree && <TreeView nodes={tree.items} startingDepth={minDepth} />}
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
              <SelectItem value="all">All</SelectItem>
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
            let theCount = count ?? (await refetchCount()).data;
            if (theCount !== undefined) {
              setOffset(Math.max(0, theCount - limit));
            }
          }}
        >
          <ChevronLast />
        </IconButton>
        <Separator orientation="vertical" className="mx-2" />
        <span className="m-1">Depth:</span>
        <Input
          type="number"
          className="w-16"
          value={minDepth}
          onChange={(e) => {
            const value = e.target.valueAsNumber;
            setMinDepth(Number.isNaN(value) ? 0 : Math.max(0, value));
          }}
        />
        <span className="m-1">-</span>
        <Input
          type="number"
          placeholder="∞"
          className="w-16"
          value={maxDepth ?? ""}
          onChange={(e) => {
            const value = e.target.valueAsNumber;
            setMaxDepth(Number.isNaN(value) ? null : Math.max(0, value));
          }}
        />
      </div>
    </div>
  );
}
