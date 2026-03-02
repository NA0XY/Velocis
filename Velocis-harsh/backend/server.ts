// server.ts
// Local dev server for testing Velocis Lambda handlers WITHOUT deploying to AWS.
// Wraps each Lambda handler in Express routes, simulating API Gateway behavior.
// Run with: npm run dev

import express, { Request, Response, NextFunction } from "express";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env before importing any handler (handlers read config at import time)
dotenv.config({ path: path.resolve(__dirname, ".env") });

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow frontend dev server
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin ?? "";
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,Cookie,X-Requested-With"
    );
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }
    next();
});

// ─────────────────────────────────────────────
// LAMBDA ADAPTER
// Converts Express req → APIGatewayProxyEvent, runs the handler,
// then converts APIGatewayProxyResult → Express res.
// ─────────────────────────────────────────────

function buildEvent(req: Request): APIGatewayProxyEvent {
    const pathParameters: Record<string, string> = {};
    // Extract any :param segments from the matched route
    if (req.params) {
        for (const [k, v] of Object.entries(req.params)) {
            pathParameters[k] = v as string;
        }
    }

    return {
        httpMethod: req.method,
        path: req.path,
        pathParameters: Object.keys(pathParameters).length ? pathParameters : null,
        queryStringParameters:
            Object.keys(req.query).length
                ? (req.query as Record<string, string>)
                : null,
        multiValueQueryStringParameters: null,
        headers: req.headers as Record<string, string>,
        multiValueHeaders: {},
        body: req.body ? JSON.stringify(req.body) : null,
        isBase64Encoded: false,
        stageVariables: null,
        resource: req.path,
        requestContext: {
            requestId: `local-${Date.now()}`,
            accountId: "local",
            apiId: "local",
            httpMethod: req.method,
            identity: {
                sourceIp: req.ip ?? "127.0.0.1",
                userAgent: req.headers["user-agent"] ?? "",
                accessKey: null,
                accountId: null,
                apiKey: null,
                apiKeyId: null,
                caller: null,
                clientCert: null,
                cognitoAuthenticationProvider: null,
                cognitoAuthenticationType: null,
                cognitoIdentityId: null,
                cognitoIdentityPoolId: null,
                principalOrgId: null,
                user: null,
                userArn: null,
            },
            path: req.path,
            protocol: "HTTP/1.1",
            resourceId: "local",
            resourcePath: req.path,
            stage: "local",
            requestTimeEpoch: Date.now(),
            requestTime: new Date().toISOString(),
            authorizer: null,
            extendedRequestId: undefined,
        },
    };
}

function sendResult(res: Response, result: APIGatewayProxyResult): void {
    // Handle multiple Set-Cookie headers via multiValueHeaders
    const multiCookies: string[] =
        (result as any).multiValueHeaders?.["Set-Cookie"] ?? [];
    const singleCookie = result.headers?.["Set-Cookie"];

    const allCookies = [
        ...multiCookies,
        ...(singleCookie ? [singleCookie] : []),
    ] as string[];

    // Forward all response headers
    if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
            if (key === "Set-Cookie") continue; // Handled below
            res.setHeader(key, String(value));
        }
    }

    // Set cookies individually
    for (const cookie of allCookies) {
        res.append("Set-Cookie", cookie);
    }

    res.status(result.statusCode);

    if (!result.body) {
        res.end();
        return;
    }

    const contentType = result.headers?.["Content-Type"] ?? "application/json";
    res.setHeader("Content-Type", String(contentType));
    res.send(result.body);
}

type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

function wrap(handler: LambdaHandler) {
    return async (req: Request, res: Response) => {
        try {
            const event = buildEvent(req);
            const result = await handler(event);
            sendResult(res, result);
        } catch (err) {
            console.error("Handler error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    };
}

// ─────────────────────────────────────────────
// ROUTES
// Import handlers lazily so dotenv loads first
// ─────────────────────────────────────────────

async function registerRoutes(): Promise<void> {
    // ── Auth ───────────────────────────────────────────────────────────────────
    try {
        const { handler: authGithub } = await import("./src/handlers/api/authGithub");
        app.get("/api/auth/github", wrap(authGithub));
        console.log("  ✅ GET  /api/auth/github");
    } catch (err) {
        console.error("  ❌ authGithub failed:", (err as Error).message);
    }

    try {
        const { handler: authGithubCallback } = await import("./src/handlers/api/authGithubCallback");
        app.get("/api/auth/github/callback", wrap(authGithubCallback));
        console.log("  ✅ GET  /api/auth/github/callback");
    } catch (err) {
        console.error("  ❌ authGithubCallback failed:", (err as Error).message);
    }

    try {
        const { handler: getRepos } = await import("./src/handlers/api/getRepos");
        app.get("/api/repos", wrap(getRepos));
        console.log("  ✅ GET  /api/repos");
    } catch (err) {
        console.error("  ❌ getRepos failed:", (err as Error).message);
    }


    // ── Webhooks — NOTE: not available locally without real AWS credentials ─────
    // githubPush imports Bedrock agent modules which make module-level AWS calls.
    // To test webhooks, deploy to AWS or use 'sam local start-api' with real creds.
    app.post("/webhooks/github/push", (_req: Request, res: Response) => {
        res.status(503).json({
            error: "Webhook handler not available in local dev mode",
            hint: "Deploy to AWS or use: sam local start-api --env-vars env.json",
        });
        console.log("  ℹ️  POST /webhooks/github/push → 503 (requires real AWS)");
    });

    // ── Health check ───────────────────────────────────────────────────────────
    app.use((_req: Request, res: Response) => {
        res.status(404).json({ error: "Route not found" });
    });
}


// ─────────────────────────────────────────────
// START — listen first, then register routes
// This way the server always starts even if some handlers fail to load
// ─────────────────────────────────────────────

// Register the health check BEFORE handlers so it's always available
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", env: process.env.NODE_ENV ?? "development" });
});

// Start listening immediately so the server is available
app.listen(PORT, async () => {
    console.log(`\n🚀 Velocis backend running at http://localhost:${PORT}`);

    // Register handlers after the server is already up
    await registerRoutes();

    console.log(`\n   GitHub OAuth:   http://localhost:${PORT}/api/auth/github`);
    console.log(`   Callback:       http://localhost:${PORT}/api/auth/github/callback`);
    console.log(`   Webhook:        http://localhost:${PORT}/webhooks/github/push`);
    console.log(`   Health:         http://localhost:${PORT}/health\n`);
});
