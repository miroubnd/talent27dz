/**
 * Shims for Supabase Edge Functions when TypeScript runs without Deno's lib.
 */
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void
}
