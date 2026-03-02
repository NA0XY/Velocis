// src/handlers/api/authGithub.ts
// Lambda handler: GET /api/auth/github
//
// Entry point for the GitHub OAuth login flow.
// Generates a random CSRF state token, stores it in DynamoDB with a 10-min TTL,
// builds the GitHub authorization URL, and redirects the user to GitHub to approve.
//
// This handler does NOT require authentication — it is the first step in login.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { initOAuthFlow } from "../../services/github/auth";
import { logger } from "../../utils/logger";
import { config } from "../../utils/config";

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const requestId = event.requestContext?.requestId ?? "unknown";
    logger.info({ requestId, msg: "authGithub: login initiated" });

    // ── Build CORS headers ─────────────────────────────────────────────────────
    const origin = event.headers["origin"] ?? event.headers["Origin"] ?? "";
    const isAllowedOrigin = config.ALLOWED_ORIGINS.includes(origin);

    const corsHeaders: Record<string, string> = {
        "Access-Control-Allow-Origin": isAllowedOrigin ? origin : config.FRONTEND_URL,
        "Access-Control-Allow-Credentials": "true",
    };

    try {
        // ── Generate Authorization URL + CSRF State ──────────────────────────────
        const { authorizationUrl, state } = await initOAuthFlow({
            redirectUri: config.GITHUB_OAUTH_REDIRECT_URI,
        });

        logger.info({
            requestId,
            msg: "authGithub: redirecting to GitHub",
            authUrlPrefix: authorizationUrl.substring(0, 60) + "...",
        });

        // ── Set state in a short-lived HttpOnly cookie ────────────────────────────
        // The callback handler reads this cookie to validate CSRF state.
        // Secure=true in production, Secure=false for local HTTP dev.
        const isProduction = config.NODE_ENV === "production";
        const stateCookie = [
            `github_oauth_state=${state}`,
            "HttpOnly",
            "SameSite=Lax",
            `Max-Age=600`,   // 10 minutes — same TTL as DynamoDB state record
            `Path=/`,
            ...(isProduction ? ["Secure"] : []),
        ].join("; ");

        // ── Redirect to GitHub ────────────────────────────────────────────────────
        return {
            statusCode: 302,
            headers: {
                ...corsHeaders,
                Location: authorizationUrl,
                "Set-Cookie": stateCookie,
                "Cache-Control": "no-store, no-cache",
            },
            body: "",
        };
    } catch (err) {
        logger.error({
            requestId,
            msg: "authGithub: failed to initiate OAuth flow",
            error: String(err),
        });

        return {
            statusCode: 500,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                error: "Failed to initiate GitHub login. Please try again.",
            }),
        };
    }
};
