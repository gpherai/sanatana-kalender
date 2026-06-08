import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

const pkgVersion = (() => {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
})();

// =============================================================================
// Security Headers
// =============================================================================
// Based on OWASP recommendations and modern security best practices.
// @see https://owasp.org/www-project-secure-headers/
// @see https://nextjs.org/docs/app/api-reference/next-config-js/headers
// =============================================================================

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  // Prevents browsers from MIME-sniffing a response away from the declared content-type
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Prevents the page from being displayed in an iframe (clickjacking protection)
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Controls how much referrer information should be included with requests
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Controls browser features like camera, microphone, geolocation
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Enforces HTTPS (only enable if you have SSL configured)
  // Uncomment in production when behind a reverse proxy with SSL:
  // {
  //   key: "Strict-Transport-Security",
  //   value: "max-age=31536000; includeSubDomains",
  // },
  // Content Security Policy
  // unsafe-inline: required for Tailwind and Next.js inline scripts (theme init)
  // unsafe-eval: required by React/Next.js in dev for debugging callstacks, removed in production
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://openweathermap.org https://*.tile.openstreetmap.org",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

// =============================================================================
// Next.js Configuration
// =============================================================================

const nextConfig: NextConfig = {
  // Bake the package version into the bundle at build time so it's available
  // in standalone Docker where npm lifecycle vars like npm_package_version are absent.
  env: {
    APP_VERSION: pkgVersion,
  },

  // OWM weather icons
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "openweathermap.org",
        pathname: "/img/wn/**",
      },
    ],
    // Required from Next.js 16: restricts which quality values can be requested
    // via the /_next/image optimization API (security measure)
    qualities: [75],
  },

  reactCompiler: true,

  // Standalone output for Docker deployment
  // This creates a self-contained build in .next/standalone
  output: "standalone",

  // Exclude native modules from server bundling
  // swisseph uses native Node.js addons (.node files) that can't be bundled
  // @prisma/client uses a WASM engine that often has resolution issues in Turbopack
  serverExternalPackages: ["swisseph", "@prisma/client"],

  // Security headers for all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // Disable x-powered-by header (security through obscurity)
  poweredByHeader: false,

  // TypeScript and ESLint are enforced via npm scripts (validate command)
  // Not configured here as Next.js 16 handles this differently

  // Allow cross-origin requests in development to silence Turbopack warning
  // According to Next.js 15+ docs, this should be at the root of the config
  allowedDevOrigins: ["http://10.51.63.101:3000", "10.51.63.101"],
};

export default nextConfig;
