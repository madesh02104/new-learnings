import "./App.css";
import { MovieList } from "./components/MovieList";
import { MovieInput } from "./components/MovieInput";

function App() {
  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">Movie Collection</h1>
        <p className="app-subtitle">Manage your favorite films</p>
      </div>
      <div className="app-content">
        <MovieInput />
        <MovieList />
      </div>
    </div>
  );
}

export default App;
