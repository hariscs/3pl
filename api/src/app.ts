import { join } from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import fastifyEnv from '@fastify/env'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { envSchema } from './config/env'
import { registerSwagger } from './config/swagger'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!

  // Load and validate environment before any plugin/route that needs config.
  await fastify.register(fastifyEnv, {
    confKey: 'config',
    schema: envSchema,
    dotenv: true,
  })

  // Register Swagger before routes so its onRoute hook documents everything.
  await registerSwagger(fastify)

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  // This loads all routes defined in routes, mounted under a versioned prefix.
  // define your routes in one of these
  // eslint-disable-next-line no-void
  void fastify.register(
    async (api) => {
      await api.register(AutoLoad, {
        dir: join(__dirname, 'routes'),
        options: opts,
      })
    },
    { prefix: '/api/v1' }
  )
}

export default app
export { app, options }
