import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Tailwind v4 走 postcss.config.mjs 统一处理（webpack / Turbopack 都生效），
  // 不再单独配 turbopack rules，避免 webpack 构建时 CSS 完全不编译。
};

export default nextConfig;
