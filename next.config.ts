import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo en desarrollo: permite abrir el servidor (`next dev -H 0.0.0.0`) desde otro dispositivo de la red de la casa,
  // como un celular, sin que Next bloquee la recarga en caliente (/_next/hmr). Cada * es un número de la IP.
  allowedDevOrigins: ["192.168.*.*"],
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
