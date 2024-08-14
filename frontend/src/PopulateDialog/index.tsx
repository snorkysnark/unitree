import { ReactNode, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Button } from "@/shadcn/ui/button";
import { Slider } from "@/shadcn/ui/slider";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Progress } from "@/shadcn/ui/progress";
import { useMutation } from "@tanstack/react-query";

import { NodeIn, insertTreeApiTreePost } from "@/client";
import { generateTree } from "./generateTree";

function PopulateParams({
  iterations,
  onIterationsChange,
}: {
  iterations: number;
  onIterationsChange(value: number): void;
}) {
  return (
    <>
      <Label htmlFor="populate-iterations">Iterations:</Label>
      <div className="flex gap-2">
        <Slider
          min={1}
          max={100000}
          value={[iterations]}
          onValueChange={([value]) => onIterationsChange(value)}
        />
        <Input
          id="populate-iterations"
          className="w-24"
          type="number"
          min={1}
          value={iterations}
          onChange={(e) => onIterationsChange(e.target.valueAsNumber)}
        />
      </div>
    </>
  );
}

const generateTreeDefault = () => generateTree({ maxDepth: 6, maxChildren: 4 });

export default function PopulateDialog({ trigger }: { trigger: ReactNode }) {
  const [iterations, setIterations] = useState(10000);

  const [progress, setProgress] = useState<number | null>(null);
  const mutation = useMutation({
    mutationFn: (tree: NodeIn) =>
      insertTreeApiTreePost({ requestBody: tree, insertBefore: "random" }),
    onSuccess: () => {
      const progressNext = progress! + 1;
      if (progressNext < iterations) {
        setProgress(progressNext);
        mutation.mutate(generateTreeDefault());
      } else {
        setProgress(null);
      }
    },
  });

  const beginPopulate = useCallback(() => {
    setProgress(0);
    mutation.mutate(generateTreeDefault());
  }, []);

  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value || progress == null) setOpen(value);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Populate</DialogTitle>
          <DialogDescription>Fill with random data</DialogDescription>
        </DialogHeader>

        {progress == null ? (
          <PopulateParams
            iterations={iterations}
            onIterationsChange={setIterations}
          />
        ) : (
          <Progress value={(progress / iterations) * 100} />
        )}

        <DialogFooter>
          <Button disabled={progress != null} onClick={beginPopulate}>
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
