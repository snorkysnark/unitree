import TreeView from "./TreeView";
import PopulateDialog from "./PopulateDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

function App() {
  const queryClient = useQueryClient();
  const [populateOpen, setPopulateOpen] = useState(false);

  const invalidateTree = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === "children",
    });
  }, []);

  return (
    <div className="h-svh flex flex-col">
      <div className="flex bg-gray-300 p-1">
        <div className="flex-1" />
        <PopulateDialog
          open={populateOpen}
          onOpenChange={(value) => {
            if (!value) invalidateTree();
            setPopulateOpen(value);
          }}
          trigger={<button className="bg-white px-1">Populate</button>}
        />
      </div>
      <div className="flex-1">
        <TreeView />
      </div>
    </div>
  );
}

export default App;
