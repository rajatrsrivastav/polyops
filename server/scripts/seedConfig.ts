import { z } from 'zod';

function demoId(fallback: string) {
  return z.preprocess(
    (value) => value === undefined || value === '' ? fallback : value,
    z.string().trim().min(1).max(128),
  );
}
const seedSchema = z.object({
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//).optional(),
  DEMO_OWNER_UID: demoId('packbay-demo-owner'),
  DEMO_STAFF_ONE_UID: demoId('packbay-demo-staff-one'),
  DEMO_STAFF_TWO_UID: demoId('packbay-demo-staff-two'),
  DEMO_SEED_END_DATE: z.iso.date().default('2026-11-19'),
  DEMO_OWNER_PASSWORD: z.string().min(8).optional(),
  DEMO_STAFF_ONE_PASSWORD: z.string().min(8).optional(),
  DEMO_STAFF_TWO_PASSWORD: z.string().min(8).optional(),
});
const cliSeedSchema = seedSchema.extend({
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//),
  DEMO_OWNER_PASSWORD: z.string().min(8),
  DEMO_STAFF_ONE_PASSWORD: z.string().min(8),
  DEMO_STAFF_TWO_PASSWORD: z.string().min(8),
});

export class SeedConfigError extends Error {
  constructor(names: string[]) {
    super(`Invalid seed configuration variables: ${[...new Set(names)].join(', ')}`);
    this.name = 'SeedConfigError';
  }
}

export function readSeedConfig(env: NodeJS.ProcessEnv, requirePasswords = false) {
  const parsed = (requirePasswords ? cliSeedSchema : seedSchema).safeParse(env);
  if (!parsed.success) {
    throw new SeedConfigError(parsed.error.issues.map(issue => issue.path.join('.')));
  }
  const ids = [parsed.data.DEMO_OWNER_UID, parsed.data.DEMO_STAFF_ONE_UID, parsed.data.DEMO_STAFF_TWO_UID];
  if (new Set(ids).size !== ids.length) {
    throw new SeedConfigError(['DEMO_OWNER_UID', 'DEMO_STAFF_ONE_UID', 'DEMO_STAFF_TWO_UID']);
  }
  return parsed.data;
}
