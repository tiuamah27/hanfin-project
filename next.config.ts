import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://slywtekcxvcakeqmabcx.supabase.co/**'),
    ],
  },
};

export default nextConfig;
