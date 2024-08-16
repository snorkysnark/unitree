import {
  UseQueryOptions,
  UseQueryResult,
  useQueries,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { NodeOut, ApiError, childrenOfApiChildrenNodeIdGet } from "@/client";
import { map, pipe, zip } from "iter-ops";

export type ParentId = number | "root";
export type ChildQueryResult = UseQueryResult<NodeOut[], ApiError>;

export interface ChildrenQueryResultsMap {
  // Assume the "root" is always present
  root: ChildQueryResult;
  [id: number]: ChildQueryResult | undefined;
}

export function useChildrenQuery(parentIds: Set<ParentId>) {
  const combine = useCallback(
    (results: UseQueryResult<NodeOut[], ApiError>[]) =>
      Object.fromEntries(
        pipe(parentIds, zip(results))
      ) as unknown as ChildrenQueryResultsMap,
    [parentIds]
  );

  return useQueries({
    queries: [
      ...pipe(
        parentIds,
        map((nodeId) => ({
          queryKey: ["children", nodeId],
          queryFn: () => childrenOfApiChildrenNodeIdGet({ nodeId }),
        }))
      ),
    ] as UseQueryOptions<NodeOut[], ApiError>[],
    combine,
  });
}
