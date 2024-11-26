// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    experimental: {
        serverActions: true,
    }
}

// Use export default instead of module.exports
export default nextConfig;