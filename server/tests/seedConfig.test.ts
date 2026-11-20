import { readSeedConfig, SeedConfigError } from '../scripts/seedConfig';

const cliEnv = {
  DATABASE_URL: 'postgres://synthetic/packbay',
  DEMO_OWNER_PASSWORD: 'synthetic-owner-password',
  DEMO_STAFF_ONE_PASSWORD: 'synthetic-staff-one-password',
  DEMO_STAFF_TWO_PASSWORD: 'synthetic-staff-two-password',
};

test('AC35: demo IDs are stable defaults without external identity provisioning', () => {
  const first = readSeedConfig(cliEnv, true);
  expect(first.DEMO_OWNER_UID).toBe('packbay-demo-owner');
  expect(first.DEMO_STAFF_ONE_UID).toBe('packbay-demo-staff-one');
  expect(first.DEMO_STAFF_TWO_UID).toBe('packbay-demo-staff-two');
  expect(readSeedConfig(cliEnv, true)).toEqual(first);
});

test('AC36: explicitly supplied demo IDs are retained and empty example values use defaults', () => {
  expect(readSeedConfig({ ...cliEnv, DEMO_OWNER_UID: 'existing-demo-owner' }, true).DEMO_OWNER_UID).toBe('existing-demo-owner');
  expect(readSeedConfig({ ...cliEnv, DEMO_OWNER_UID: '' }, true).DEMO_OWNER_UID).toBe('packbay-demo-owner');
});

test('AC37: CLI seed rejects absent passwords before destructive work with names-only diagnostics', () => {
  const env = { DATABASE_URL: 'postgres://synthetic/packbay' };
  expect(() => readSeedConfig(env, true)).toThrow(SeedConfigError);
  try {
    readSeedConfig(env, true);
    throw new Error('Expected seed configuration failure');
  } catch (error) {
    expect(error).toBeInstanceOf(SeedConfigError);
    expect(String(error)).toContain('DEMO_OWNER_PASSWORD');
    expect(String(error)).toContain('DEMO_STAFF_ONE_PASSWORD');
    expect(String(error)).toContain('DEMO_STAFF_TWO_PASSWORD');
    expect(String(error)).not.toContain(env.DATABASE_URL);
  }
});

test('AC38: malformed values and duplicate IDs never leak their values', () => {
  const invalid = { ...cliEnv, DATABASE_URL: 'sensitive-database-placeholder', DEMO_OWNER_PASSWORD: 'short' };
  expect(() => readSeedConfig(invalid, true)).toThrow('DATABASE_URL');
  try { readSeedConfig(invalid, true); } catch (error) {
    expect(String(error)).not.toContain(invalid.DATABASE_URL);
    expect(String(error)).not.toContain(invalid.DEMO_OWNER_PASSWORD);
  }
  expect(() => readSeedConfig({ ...cliEnv, DEMO_OWNER_UID: 'same', DEMO_STAFF_ONE_UID: 'same' }, true)).toThrow('DEMO_OWNER_UID');
});
