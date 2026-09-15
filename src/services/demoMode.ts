// Written as a single inline expression (not a helper function reading process.env) so
// Vite's static replacement of import.meta.env.VITE_DEMO_MODE lets Rollup/terser fold
// this to a literal and dead-code-eliminate the unused salaryApi branch and its imports
// (verified by grepping the built demo bundle for backend references - see tasks.md 2.4).
export const isDemoMode: boolean =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_DEMO_MODE === 'true';
