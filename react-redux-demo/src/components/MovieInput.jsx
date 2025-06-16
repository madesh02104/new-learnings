import { useState } from "react";
import { addMovie } from "../movieSlice";
import { useDispatch } from "react-redux";

export const MovieInput = () => {
  const dispatch = useDispatch();
  const [newMovie, setNewMovie] = useState("");
  const [newRating, setNewRating] = useState("");

  const handleAddMovie = () => {
    if (newMovie && newRating) {
      dispatch(addMovie({ name: newMovie, rating: parseFloat(newRating) }));
      setNewMovie("");
      setNewRating("");
    }
  };

  return (
    <div className="movie-input-section">
      <h2 className="movie-input-title">Add New Movie</h2>
      <div className="movie-input-form">
        <div className="movie-input-row">
          <input
            placeholder="Movie Name"
            type="text"
            value={newMovie}
            onChange={(e) => setNewMovie(e.target.value)}
          />
          <input
            placeholder="Rating (0-10)"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={newRating}
            onChange={(e) => setNewRating(e.target.value)}
          />
        </div>
        <button onClick={handleAddMovie}>Add Movie</button>
      </div>
    </div>
  );
};
