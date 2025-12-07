const path = require("path");

// Set Prisma engine path before Next.js starts
const prismaEnginePath = path.join(
  __dirname,
  "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"
);

if (require("fs").existsSync(prismaEnginePath)) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = prismaEnginePath;
}

const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
