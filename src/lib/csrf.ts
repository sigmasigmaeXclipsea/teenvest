// Simple CSRF token handling for the frontend
// In production, use a proper CSRF library

export function getCSRFToken(): string {
  let token = sessionStorage.getItem('csrf-token');
  if (!token) {
    token = generateToken();
    sessionStorage.setItem('csrf-token', token);
  }
  return token;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Add CSRF token to fetch options for state-changing requests
export function withCSRF(options: RequestInit = {}): RequestInit {
  const token = getCSRFToken();
  return {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      'X-CSRF-Token': token,
    },
  };
}

// Wrapper for supabase functions to include CSRF
export async function invokeFunctionWithCSRF(
  functionName: string,
  options: { body?: any; headers?: Record<string, string> } = {}
) {
  const { body, headers = {} } = options;
  const token = getCSRFToken();
  const authToken = await getSupabaseToken();
  
  const response = await fetch(`/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
      Authorization: `Bearer ${authToken}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Function invocation failed');
  }
  return response.json();
}

async function getSupabaseToken(): Promise<string> {
  // This should match how you get the Supabase token in your app
  // For example, from localStorage or a context
  const { data: { session } } = await (window as any).supabase.auth.getSession();
  return session?.access_token || '';
}
