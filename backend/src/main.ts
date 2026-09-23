import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';

const expressFn: any = express;
const server = (typeof expressFn === 'function' ? expressFn : expressFn?.default)();
let isInitialized = false;

async function bootstrapServer() {
  if (!isInitialized) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    // Security & Middleware
    app.use(helmet({
      contentSecurityPolicy: false
    }));
    app.use(cookieParser());

    // CORS
    app.enableCors({
      origin: (_origin: unknown, callback: (err: Error | null, allow?: boolean) => void) => {
        return callback(null, true);
      },
      credentials: true,
    });

    // Global prefix
    app.setGlobalPrefix('api');

    // Validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    // Swagger (local / standalone server only)
    if (!process.env.VERCEL) {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('Brain Exercises Pro API')
        .setDescription('Adaptive Speed Reading & Cognitive Brain Training Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('api/docs', app, document);
    }

    await app.init();
    isInitialized = true;
  }
  return server;
}

export default async function handler(req: any, res: any) {
  try {
    const expressApp = await bootstrapServer();
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      req._body = true;
    }
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
    }
    return expressApp(req, res);
  } catch (err: any) {
    console.error('Unhandled Vercel serverless error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ statusCode: 500, message: 'Internal Server Error', error: err?.message || String(err) }));
  }
}

// CommonJS module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  (module.exports as any).default = handler;
}

if (!process.env.VERCEL && !process.env.NOW_REGION) {
  bootstrapServer().then(() => {
    const port = process.env.PORT || process.env.APP_PORT || 3001;
    server.listen(port, () => {
      console.log(`🧠 Brain Exercises Pro API running on http://localhost:${port}/api`);
      console.log(`📖 Swagger API documentation at http://localhost:${port}/api/docs`);
    });
  }).catch((err) => {
    console.error('Failed to start standalone server:', err);
  });
}
