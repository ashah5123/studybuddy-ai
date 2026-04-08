# Google OAuth Setup

Follow these steps to enable Google sign-in for StudyBuddy AI.

---

## 1. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project → New Project**
3. Name it (e.g. `studybuddy-ai`) and click **Create**

---

## 2. Enable the OAuth consent screen

1. In the left sidebar go to **APIs & Services → OAuth consent screen**
2. Choose **External** and click **Create**
3. Fill in:
   - **App name**: StudyBuddy AI
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** through the remaining steps (no scopes needed beyond the defaults)
5. Click **Back to Dashboard** and set the publishing status to **In production** when ready (leave as *Testing* during development)

---

## 3. Create OAuth 2.0 credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Set **Application type** to **Web application**
4. Under **Authorized redirect URIs** add:

   ```
   https://yoavlbotcmbiqfdnbuiw.supabase.co/auth/v1/callback
   ```

   For local development also add:
   ```
   http://localhost:3000/auth/callback
   ```

5. Click **Create**
6. Copy the **Client ID** and **Client Secret** — you will need them in the next step

---

## 4. Add credentials to Supabase

1. Open the [Supabase dashboard](https://supabase.com/dashboard/project/yoavlbotcmbiqfdnbuiw)
2. Go to **Authentication → Providers**
3. Click **Google**
4. Toggle **Enable Google provider** on
5. Paste in the **Client ID** and **Client Secret** from step 3
6. Click **Save**

---

## 5. Verify the callback route

The OAuth callback is handled at:

```
src/app/auth/callback/route.ts
```

It exchanges the auth code for a session and redirects to `/dashboard`. No additional configuration is required.

---

## 6. Local development checklist

- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3000` set in `.env.local`
- [ ] `http://localhost:3000/auth/callback` added to Google authorized redirect URIs
- [ ] Google provider enabled in Supabase dashboard
