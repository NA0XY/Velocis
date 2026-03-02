// src/app/services/api.ts
// Centralized API service for all Velocis backend calls
// Uses the session cookie automatically (credentials: 'include')
// All requests go to VITE_BACKEND_URL — configured per environment

const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

// ─────────────────────────────────────────────
// BASE FETCH WRAPPER
// ─────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        credentials: 'include',   // Always send session cookie
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (res.status === 401) {
        // Session expired — redirect to auth page
        window.location.href = '/auth?error=session_expired';
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body?.error ?? 'Request failed');
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// AUTH ENDPOINTS
// ─────────────────────────────────────────────

/** Redirect the user to GitHub OAuth — use window.location.href directly */
export const githubLoginUrl = `${BASE}/api/auth/github`;

/** Fetches the currently logged-in user's profile */
export async function getMe(): Promise<VelocisUser | null> {
    try {
        return await apiFetch<VelocisUser>('/api/me');
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────
// REPOSITORY ENDPOINTS
// ─────────────────────────────────────────────

/** Fetches all repositories visible to the logged-in user */
export async function getRepositories(): Promise<VelocisRepo[]> {
    return apiFetch<VelocisRepo[]>('/api/repos');
}

/** Fetches a single repository by its ID */
export async function getRepository(repoId: string): Promise<VelocisRepo> {
    return apiFetch<VelocisRepo>(`/api/repos/${repoId}`);
}

// ─────────────────────────────────────────────
// ACTIVITY ENDPOINTS
// ─────────────────────────────────────────────

/** Fetches recent AI agent activity for the current user */
export async function getActivity(limit = 20): Promise<VelocisActivity[]> {
    return apiFetch<VelocisActivity[]>(`/api/activity?limit=${limit}`);
}

// ─────────────────────────────────────────────
// TYPES (mirrors backend models)
// ─────────────────────────────────────────────

export interface VelocisUser {
    githubId: string;
    username: string;
    displayName: string;
    email: string;
    avatarUrl: string;
    githubProfileUrl: string;
    installationId?: number;
    plan: 'free' | 'pro' | 'team';
    createdAt: string;
    updatedAt: string;
}

export interface VelocisRepo {
    repoId: string;
    repoName: string;
    repoFullName: string;
    ownerGithubId: string;
    defaultBranch: string;
    isPrivate: boolean;
    language: string | null;
    status: 'healthy' | 'warning' | 'critical' | 'processing' | 'pending';
    installationId: number;
    lastPushAt?: string;
    lastPushedBy?: string;
    lastCommitSha?: string;
    sentinel?: Record<string, unknown>;
    fortress?: Record<string, unknown>;
    cortex?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface VelocisActivity {
    activityId: string;
    createdAt: string;
    repoId: string;
    repoFullName: string;
    agent: 'sentinel' | 'fortress' | 'cortex';
    event: string;
    status: 'success' | 'warning' | 'failed' | 'skipped';
    summary: string;
    commitSha?: string;
}

// ─────────────────────────────────────────────
// ERROR CLASS
// ─────────────────────────────────────────────

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}
