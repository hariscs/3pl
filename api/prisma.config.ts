import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 no longer auto-loads .env. Load it for CLI commands (migrate/generate/seed).
try {
  process.loadEnvFile(path.join(__dirname, '.env'))
} catch {
  // .env is optional when DATABASE_URL is provided by the environment (e.g. CI).
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
})
