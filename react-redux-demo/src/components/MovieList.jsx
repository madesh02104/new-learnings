import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeMovie } from "../movieSlice";

export const MovieList = () => {
  const movies = useSelector((state) => state.movies.movies);
  const dispatch = useDispatch();

  const handleRemoveMovie = (id) => {
    dispatch(removeMovie(id));
  };

  return (
    <div className="movie-list-section">
      <h2 className="movie-list-title">Your Movies</h2>
      {movies.length === 0 ? (
        <div className="empty-state">
          No movies added yet. Add your first movie above!
        </div>
      ) : (
        <div className="movie-list">
          {movies.map((movie) => (
            <div key={movie.id} className="movie-item">
              <div className="movie-info">
                <span className="movie-name">{movie.name}</span>
                <span className="movie-rating">{movie.rating}</span>
              </div>
              <div className="movie-actions">
                <button
                  className="delete-button"
                  onClick={() => handleRemoveMovie(movie.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
