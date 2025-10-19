const owner = process.env.GITHUB_OWNER || "TheInkedEngineer"
const repo = process.env.GITHUB_REPO || "cosecase-blog"

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: `/${owner}/${repo}/**`,
      },
    ],
  },
}

export default nextConfig
