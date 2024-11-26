/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    serverOptions: {
        port: parseInt(process.env.PORT || '10000', 10)
    }
}

module.exports = nextConfig