import { ReactNode, useEffect, useState } from "react";
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

function generateTreeDefault() {
  return generateTree({ maxDepth: 6, maxChildren: 4 });
}

function PopulateSettingsEdit({
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
          max={1000}
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

type DialogStatus =
  | {
      mode: "settings";
    }
  | { mode: "progress"; progress: number }
  | { mode: "closing" };

export default function PopulateDialog({ trigger }: { trigger: ReactNode }) {
  const [iterations, setIterations] = useState(500);
  const [status, setStatus] = useState<DialogStatus>({ mode: "settings" });

  const mutation = useMutation({
    mutationFn: (tree: NodeIn) =>
      insertTreeApiTreePost({ requestBody: tree, insertBefore: "random" }),
    onSuccess() {
      if (status.mode == "progress") {
        const progressNext = status.progress + 1;
        if (progressNext < iterations) {
          setStatus({ mode: "progress", progress: progressNext });
          mutation.mutate(generateTreeDefault());
        } else {
          setStatus({ mode: "settings" });
        }
      }
    },
    onSettled() {
      if (status.mode == "closing") {
        setOpen(false);
      }
    },
  });

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) {
      // Reset status after closing
      setStatus({ mode: "settings" });
    }
  }, [open]);
  useEffect(() => {
    if (status.mode == "closing" && !mutation.isPending) {
      // Close immediately if no transaction in progress
      setOpen(false);
    }
  }, [status.mode, mutation.isPending]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) {
          setOpen(true);
        } else {
          setStatus({ mode: "closing" });
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Populate</DialogTitle>
          <DialogDescription>Fill with random data</DialogDescription>
        </DialogHeader>

        {status.mode === "closing" ? (
          <p>Closing</p>
        ) : status.mode === "settings" ? (
          <PopulateSettingsEdit
            iterations={iterations}
            onIterationsChange={setIterations}
          />
        ) : (
          <Progress value={(status.progress / iterations) * 100} />
        )}

        <DialogFooter>
          <Button
            disabled={status.mode !== "settings"}
            onClick={() => {
              setStatus({ mode: "progress", progress: 0 });
              mutation.mutate(generateTreeDefault());
            }}
          >
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
