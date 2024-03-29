// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  async redirects() {
    return [
      {
        source: "/account",
        destination: "/account/billing",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        port: "",
        pathname: "**",
        hostname: "tailwindui.com",
      },
      {
        protocol: "https",
        port: "",
        pathname: "**",
        hostname: "images.unsplash.com",
      },
    ],
  },
};
export default config;
