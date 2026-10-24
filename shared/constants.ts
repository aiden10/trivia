// Backend URLs used by the frontend.
//
// By default they point at the local FastAPI server during development
// (`next dev`) and at the hosted server in production builds

// To override a URL, set the matching NEXT_PUBLIC_* variable. For local dev
// put it in `.env.development.local` (gitignored); for a production build put
// it in `.env.production` / your hosting provider's env settings.
// See `.env.example`.

const isDev = process.env.NODE_ENV === "development";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (isDev ? "http://localhost:8000/ws" : "wss://132.145.109.45/ws");

export const CREATE_ROOM_ENDPOINT =
  process.env.NEXT_PUBLIC_CREATE_ROOM_ENDPOINT ??
  (isDev
    ? "http://localhost:8000/rooms/create"
    : "https://132.145.109.45/rooms/create");

export const GET_SONG_ENDPOINT =
  process.env.NEXT_PUBLIC_GET_SONG_ENDPOINT ??
  (isDev ? "http://localhost:8000/songs" : "https://132.145.109.45/songs");

export const WIKIDATA_SEARCH_URL = "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=";
