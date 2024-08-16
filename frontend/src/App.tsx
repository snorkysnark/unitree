import TreeView from "./TreeView";
import PopulateDialog from "./PopulateDialog";

function App() {
  return (
    <div className="h-svh flex flex-col">
      <div className="flex bg-gray-300 p-1">
        <div className="flex-1" />
        <PopulateDialog
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
