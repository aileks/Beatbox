import {
  legacy_createStore as createStore,
  applyMiddleware,
  compose,
  combineReducers,
} from "redux";
import thunk from "redux-thunk";
import sessionReducer from "./session";
import songsReducer from "./songs";
import albumsReducer from "./albums";
import playlistsReducer from "./playlists";
import artistsReducer from "./artists";
import genresReducer from "./genres";
import queueReducer from "./queue";
import libraryReducer from "./library";
import likedReducer from "./liked";
import myPlaylistsReducer from "./myPlaylists";

const rootReducer = combineReducers({
  session: sessionReducer,
  songs: songsReducer,
  albums: albumsReducer,
  playlists: playlistsReducer,
  artists: artistsReducer,
  genres: genresReducer,
  queue: queueReducer,
  liked: likedReducer,
  library: libraryReducer,
  myPlaylists: myPlaylistsReducer,
});

let enhancer;
if (import.meta.env.MODE === "production") {
  enhancer = applyMiddleware(thunk);
} else {
  const logger = (await import("redux-logger")).default;
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  enhancer = composeEnhancers(applyMiddleware(thunk, logger));
}

const configureStore = (preloadedState) => {
  return createStore(rootReducer, preloadedState, enhancer);
};

export default configureStore;
