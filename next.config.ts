import type { NextConfig } from "next";

import { validateEnv } from "./src/lib/env";

validateEnv();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
