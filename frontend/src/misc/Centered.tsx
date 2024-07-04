import { ReactNode } from "react";

export default function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center h-full items-center">{children}</div>
  );
}
