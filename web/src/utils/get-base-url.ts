export const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.BASE_URL) return `https://${process.env.BASE_URL}`; // SSR should use vercel url
  return `http://127.0.0.1:${process.env.PORT ?? 80}`; // dev SSR should use localhost
};
