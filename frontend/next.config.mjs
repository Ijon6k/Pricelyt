/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained build (.next/standalone/server.js) so the
  // Docker runtime image stays small and runs without the full node_modules.
  output: "standalone",
  reactCompiler: true,
};

export default nextConfig;
