import { z } from 'zod';

const envSchema = z.object({
    // Server-side
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

    // Client-side (Public)
    // These are optional because the codebase still falls back to mock endpoints
    // However, providing them in production should be tracked by a TODO
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export function validateEnv() {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment variables');
    }
}

// 起動時にインポートされたタイミングで自動的にチェックを走らせることも可能ですが、
// 意図どおり動かすために明示的に関数化しています。
