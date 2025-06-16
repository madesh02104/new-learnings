import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  movies: [
    { id: 1, name: "Interstellar", rating: 8.8 },
    { id: 2, name: "Inception", rating: 8.2 },
    { id: 3, name: "The Dark Knight", rating: 8.6 },
  ],
};

const movieSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    addMovie: (state, action) => {
      const newMovie = {
        id:
          state.movies.length > 0
            ? state.movies[state.movies.length - 1].id + 1
            : 1,
        name: action.payload.name,
        rating: action.payload.rating,
      };
      state.movies.push(newMovie);
    },
    removeMovie: (state, action) => {
      state.movies = state.movies.filter(
        (movie) => movie.id !== action.payload
      );
    },
  },
});

export const { addMovie, removeMovie } = movieSlice.actions;
export default movieSlice.reducer;
