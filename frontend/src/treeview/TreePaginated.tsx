import { getTreeApiTreeGet } from "@/client";
import { useQuery } from "@tanstack/react-query";
import { useMeasure } from "@react-hookz/web";
import { FixedSizeList as List } from "react-window";
import { ReactNode } from "react";

export default function TreePaginated() {
  const { data } = useQuery({
    queryKey: ["tree"],
    queryFn: () => getTreeApiTreeGet(),
  });

  const [measurements, measureRef] = useMeasure<HTMLDivElement>();

  return (
    <div className="w-full h-full" ref={measureRef}>
      <List
        itemSize={20}
        itemCount={data?.length ?? 0}
        width={measurements?.width ?? 0}
        height={measurements?.height ?? 0}
      >
        {({ index, style }) => {
          let content: ReactNode = "";
          if (data) {
            const node = data[index];
            content = node.title;
            style = { ...style, marginLeft: `${node.depth * 2}rem` };
          }

          return <div style={style}>{data ? data[index].title : ""}</div>;
        }}
      </List>
    </div>
  );
}
