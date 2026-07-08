/**
 * True only for the public GitHub Pages demo build (`npm run build:demo`), which runs entirely
 * against a local, ephemeral database and skips login. Absent (or any other value) means the
 * normal Firebase-backed app — this is the default and requires no flag to be set.
 */
export const IS_DEMO = import.meta.env.VITE_APP_MODE === "demo";
