// Jest rewrites import() into require(), and Better Auth ships ESM only.
export function nativeImport<T>(specifier: string): Promise<T> {
  const load = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<T>;
  return load(specifier);
}
