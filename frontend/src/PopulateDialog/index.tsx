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

const generateTreeDefault = () => generateTree({ maxDepth: 6, maxChildren: 4 });

export default function PopulateDialog({ trigger }: { trigger: ReactNode }) {
  const [settings, setSettings] = useState<PopulateSettings>({
    iterations: 200,
    maxDepth: 12,
    maxChildren: 20,
  });

  const [progress, setProgress] = useState<number | null>(null);
  const mutation = useMutation({
    mutationFn: (tree: NodeIn) =>
      insertTreeApiTreePost({ requestBody: tree, insertBefore: "random" }),
    onSuccess: () => {
      const progressNext = progress! + 1;
      if (progressNext < settings.iterations) {
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
          <PopulateSettingsEdit
            settings={settings}
            onSettingsChange={setSettings}
          />
        ) : (
          <Progress value={(progress / settings.iterations) * 100} />
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
