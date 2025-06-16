import "./App.css";
import { MovieList } from "./components/MovieList";
import { MovieInput } from "./components/MovieInput";

function App() {
  return (
    <>
      <MovieInput />
      <MovieList />
    </>
  );
}

export default App;
