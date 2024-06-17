import { useQuery } from "react-query";

function App() {
  const page1 = useQuery(["tree", 1], () =>
    fetch("/api/tree?size=50&page=1").then((result) => result.json())
  );

  return <></>;
}

export default App;
