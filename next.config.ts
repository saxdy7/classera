import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type errors now fail the build. This was `ignoreBuildErrors: true`, which
  // hid ~40 real defects - unconditional 401s in every GitHub route, a webhook
  // signature check that threw, Supabase clients built with no credentials, and
  // a dead /auth/sign-in redirect among them.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'illustrations.popsy.co',
      },
      // Google OAuth profile pictures
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // GitHub OAuth profile pictures
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Integration logos on the landing page
      {
        protocol: 'https',
        hostname: 'cdn.simpleicons.org',
      },
    ],
  },
};

export default nextConfig;
