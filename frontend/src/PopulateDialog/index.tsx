import { ReactNode, useCallback, useEffect, useState } from "react";
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

interface PopulateSettings {
  iterations: number;
  maxDepth: number;
  maxChildren: number;
}

function PopulateSettingsEdit({
  settings,
  onSettingsChange,
}: {
  settings: PopulateSettings;
  onSettingsChange(settings: PopulateSettings): void;
}) {
  return (
    <>
      <Label className="text-base" htmlFor="populate-iterations">
        Iterations:
      </Label>
      <div className="flex gap-2">
        <Slider
          min={1}
          max={1000}
          value={[settings.iterations]}
          onValueChange={([iterations]) =>
            onSettingsChange({ ...settings, iterations })
          }
        />
        <Input
          id="populate-iterations"
          className="w-24"
          type="number"
          min={1}
          value={settings.iterations}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              iterations: e.target.valueAsNumber,
            })
          }
        />
      </div>
      <p className="text-sm">Single iteration:</p>
      <div className="flex gap-2">
        <Label>
          Max depth
          <Input
            type="number"
            className="mt-2"
            value={settings.maxDepth}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                maxDepth: e.target.valueAsNumber,
              })
            }
          />
        </Label>
        <Label>
          Max children
          <Input
            type="number"
            className="mt-2"
            value={settings.maxChildren}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                maxChildren: e.target.valueAsNumber,
              })
            }
          />
        </Label>
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
  const [settings, setSettings] = useState<PopulateSettings>({
    iterations: 200,
    maxDepth: 12,
    maxChildren: 20,
  });
  const [status, setStatus] = useState<DialogStatus>({ mode: "settings" });
  const treeFromSettings = useCallback(
    () =>
      generateTree({
        maxDepth: settings.maxDepth,
        maxChildren: settings.maxChildren,
      }),
    [settings]
  );

  const mutation = useMutation({
    mutationFn: (tree: NodeIn) =>
      insertTreeApiTreePost({ requestBody: tree, insertBefore: "random" }),
    onSuccess() {
      if (status.mode == "progress") {
        const progressNext = status.progress + 1;
        if (progressNext < settings.iterations) {
          setStatus({ mode: "progress", progress: progressNext });
          mutation.mutate(treeFromSettings());
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
            settings={settings}
            onSettingsChange={setSettings}
          />
        ) : (
          <Progress value={(status.progress / settings.iterations) * 100} />
        )}

        <DialogFooter>
          <Button
            disabled={status.mode !== "settings"}
            onClick={() => {
              setStatus({ mode: "progress", progress: 0 });
              mutation.mutate(treeFromSettings());
            }}
          >
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
