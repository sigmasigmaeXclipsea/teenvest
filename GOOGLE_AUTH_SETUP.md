# Google Sign-In Setup

Google login uses Supabase OAuth. To fix "Google login broken":

1. **Supabase Dashboard** → Your project → **Authentication** → **Providers**  
   - Enable **Google**.  
   - Add your Google OAuth **Client ID** and **Client Secret** (from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials).

2. **Redirect URL**  
   - **Authentication** → **URL Configuration**.  
   - Add these to **Redirect URLs**:
     - `https://teenvests.com/auth/callback`
     - `http://localhost:5173/auth/callback` (for local dev)

3. **Google Cloud Console**  
   - Your OAuth client → **Authorized redirect URIs** must include:
     - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

After saving, Google sign-in should work.
