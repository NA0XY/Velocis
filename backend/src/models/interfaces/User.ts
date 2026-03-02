// src/models/interfaces/User.ts
// TypeScript interface for the Velocis User record stored in DynamoDB
// Multi-tenant: one record per GitHub user who installs the Velocis GitHub App

export interface User {
    // ── Primary Key ────────────────────────────────────────────────────────────
    userId: string;                 // Velocis user ID (string GitHub user ID)
    githubId: string;               // GitHub's unique user ID (string for DynamoDB compatibility)

    // ── GitHub Profile ─────────────────────────────────────────────────────────
    username: string;               // GitHub login handle (e.g. "NA0XY")
    displayName: string;            // GitHub full name (e.g. "Rishi")
    email?: string;                 // Primary verified email from GitHub
    avatarUrl: string;              // GitHub avatar URL
    githubProfileUrl: string;       // https://github.com/{username}

    // ── GitHub App Installation ────────────────────────────────────────────────
    installationId?: number;        // GitHub App installation ID — set after app install
    // Required to get installation tokens for this user's repos

    // ── Encrypted OAuth Tokens (AES-256-GCM) ──────────────────────────────────
    // Tokens are ALWAYS stored encrypted — never plaintext
    accessToken?: string;           // Encrypted GitHub user OAuth access token (key used by callback)
    encryptedAccessToken?: string;  // Alternate field name for backward-compat
    encryptedRefreshToken?: string; // Encrypted refresh token (only if token expiry is enabled)
    tokenExpiresAt?: string;        // ISO timestamp when access token expires

    // ── Plan / Billing ─────────────────────────────────────────────────────────
    plan: "free" | "pro" | "team";  // Velocis subscription plan

    // ── Timestamps ─────────────────────────────────────────────────────────────
    createdAt: string;              // ISO timestamp — first login / account creation
    updatedAt: string;              // ISO timestamp — last token refresh or profile update
}

// ─────────────────────────────────────────────
// SAFE USER TYPE
// Strips all sensitive fields — safe to return to frontend
// ─────────────────────────────────────────────

export type SafeUser = Omit<
    User,
    "accessToken" | "encryptedAccessToken" | "encryptedRefreshToken" | "tokenExpiresAt"
>;

// Helper to strip sensitive fields from a User record
export function toSafeUser(user: User): SafeUser {
    const {
        accessToken: _a,
        encryptedAccessToken: _e,
        encryptedRefreshToken: _r,
        tokenExpiresAt: _t,
        ...safe
    } = user;
    return safe;
}
