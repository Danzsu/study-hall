/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx'],
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
}

export default nextConfig
