import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The analysis prompt is a plain file read at runtime, so make sure it ships to Vercel.
  outputFileTracingIncludes: { "/api/calls": ["./prompts/**/*"] },
};

export default nextConfig;
