# Netlify Environment Variables Setup

## Required Environment Variables

To fix the mobile login issues and ensure proper authentication, you need to add the following environment variables in your Netlify dashboard:

### 1. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://vvvagmviexgqeawwycwq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dmFnbXZpZXhncWVhd3d5Y3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDAzMDEsImV4cCI6MjA2NDIxNjMwMX0.JiZasInlZuqnQ058uzqrSykrXckkmy4p40VVVq0zKBM
```

### 2. Production URLs
```
NEXT_PUBLIC_SITE_URL=https://linkerai.net
NEXT_PUBLIC_APP_URL=https://linkerai.net
```

## How to Add Environment Variables in Netlify

1. **Access Netlify Dashboard**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Select your `linkerai.net` site

2. **Navigate to Environment Variables**
   - Click on "Site settings"
   - Scroll down to "Environment variables" section
   - Click "Edit variables"

3. **Add Each Variable**
   - Click "Add a variable"
   - Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the corresponding value
   - Repeat for all 4 variables above

4. **Redeploy the Site**
   - After adding all variables, go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for deployment to complete

## What This Will Fix

✅ **Mobile Authentication**: Login/signup buttons will work properly on mobile
✅ **Email Confirmations**: Email links will redirect to the correct domain
✅ **Database Connections**: Supabase will be properly configured
✅ **User Registration**: New accounts will be created successfully
✅ **Session Management**: User sessions will persist correctly

## Verification Steps

After adding the environment variables and redeploying:

1. **Test Mobile Login**
   - Open https://linkerai.net on mobile
   - Tap the hamburger menu
   - Verify login/signup buttons are visible and functional

2. **Test Registration**
   - Try creating a new account
   - Check if confirmation email is received
   - Verify email links redirect to https://linkerai.net

3. **Test Authentication Flow**
   - Login with existing credentials
   - Verify redirection to appropriate dashboard
   - Check if user session persists on refresh

## Current Issues Without These Variables

❌ Mobile users see infinite loading when trying to login
❌ Email confirmation links may not work properly
❌ Database connections may fail
❌ Authentication state may not persist correctly

## Priority

🔴 **CRITICAL** - These environment variables are essential for the application to function properly in production. 