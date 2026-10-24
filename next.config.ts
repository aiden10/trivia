import type { NextConfig } from "next";

// Safety net: warn if a production build is going to talk to a local server.
if (process.env.NODE_ENV === "production") {
  const localUrls = [
    process.env.NEXT_PUBLIC_SOCKET_URL,
    process.env.NEXT_PUBLIC_CREATE_ROOM_ENDPOINT,
    process.env.NEXT_PUBLIC_GET_SONG_ENDPOINT,
  ].filter((url): url is string => !!url && /localhost|127\.0\.0\.1/.test(url));

  if (localUrls.length > 0) {
    console.warn(
      `\n[config] Production build is using local URLs:\n  ${localUrls.join("\n  ")}\n` +
        "Remove these from your env files (or unset the env vars) before deploying.\n"
    );
  }
}

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn-images.dzcdn.net"],
  },
};

export default nextConfig;
