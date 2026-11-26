const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // O AuthController do back-end não declara @CrossOrigin, então o navegador bloquearia
  // a chamada direta a /api/auth. O login passa por este proxy do Next (mesma origem).
  async rewrites() {
    return [{ source: '/api-auth/:path*', destination: `${apiBaseUrl}/auth/:path*` }];
  },
};

export default nextConfig;
