import { useState } from "react";
import { addMovie } from "../movieSlice";
import { useDispatch } from "react-redux";

export const MovieInput = () => {
  const dispatch = useDispatch();
  const [newMovie, setNewMovie] = useState("");

  const handleAddMovie = () => {
    if (newMovie) {
      dispatch(addMovie(newMovie));
      setNewMovie("");
    }
  };

  return (
    <div>
      <input
        type="text"
        value={newMovie}
        onChange={(e) => setNewMovie(e.target.value)}
      />
      <button onClick={handleAddMovie}>Add Movie</button>
    </div>
  );
};
