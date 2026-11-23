// React Native shares its cookie jar by default. This client authenticates with bearer tokens.
export function bearerFetch(url: string, options: RequestInit) {
  return fetch(url, { ...options, credentials: 'omit' });
}
