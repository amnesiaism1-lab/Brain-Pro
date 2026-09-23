"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const app_module_1 = require("./app.module");
const expressFn = express_1.default;
const server = (typeof expressFn === 'function' ? expressFn : expressFn?.default)();
let isInitialized = false;
async function bootstrapServer() {
    if (!isInitialized) {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server));
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: false
        }));
        app.use((0, cookie_parser_1.default)());
        app.enableCors({
            origin: (_origin, callback) => {
                return callback(null, true);
            },
            credentials: true,
        });
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }));
        if (!process.env.VERCEL) {
            const swaggerConfig = new swagger_1.DocumentBuilder()
                .setTitle('Brain Exercises Pro API')
                .setDescription('Adaptive Speed Reading & Cognitive Brain Training Platform API')
                .setVersion('1.0')
                .addBearerAuth()
                .build();
            const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
            swagger_1.SwaggerModule.setup('api/docs', app, document);
        }
        await app.init();
        isInitialized = true;
    }
    return server;
}
async function handler(req, res) {
    try {
        const expressApp = await bootstrapServer();
        if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
            req._body = true;
        }
        if (req.url && !req.url.startsWith('/api')) {
            req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
        }
        return expressApp(req, res);
    }
    catch (err) {
        console.error('Unhandled Vercel serverless error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ statusCode: 500, message: 'Internal Server Error', error: err?.message || String(err) }));
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = handler;
    module.exports.default = handler;
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
//# sourceMappingURL=main.js.map