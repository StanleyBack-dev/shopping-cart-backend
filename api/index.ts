import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express } from 'express';

/**
 * Vercel's per-function compiler only processes this one file and doesn't
 * resolve this project's tsconfig path aliases (@modules/*, @common/*, ...),
 * so importing the TypeScript source directly crashes at runtime with
 * "Cannot find module '@modules/...'". Importing the already-built output
 * of `npm run build` sidesteps that entirely: `tsc-alias` has already
 * rewritten every alias to a plain relative require by the time this file
 * runs. `require` (rather than `import`) keeps that build output out of
 * *this* file's own TypeScript compilation; the `typeof import(...)` casts
 * restore proper static types from the source for everything else in this
 * file. The `vercel-build` script (see package.json) runs `npm run build`
 * before Vercel packages this function, so `dist/` always exists by then.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AppModule } = require('../dist/app.module') as typeof import('../src/app.module');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { configureApp } = require('../dist/bootstrap') as typeof import('../src/bootstrap');

/** Bootstrapped once per warm function instance and reused across invocations. */
let cachedServer: Express | undefined;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    configureApp(app);
    await app.init();
    cachedServer = expressApp;
  }

  return cachedServer;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const server = await bootstrapServer();
  server(req, res);
}
