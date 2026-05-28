import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse bundles pdfjs-dist, which loads a worker file at runtime. Bundling it
  // breaks that path resolution, so keep it external and load it from node_modules.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
