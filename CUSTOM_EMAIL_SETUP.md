# LinkerAI - Custom Email Branding Setup Guide

## Overview
This guide explains how to change the email sender name from "Supabase Auth" to "LinkerAI" for all authentication emails.

## SMTP Host Configuration Guide

### How to Find Your SMTP Host

The SMTP Host depends on your email provider. Here are the most common options:

#### 1. Gmail (Easiest Setup)
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
Encryption: STARTTLS
Username: your-email@gmail.com
Password: [app-password] (not your regular password)
```

**Setup Steps for Gmail:**
1. Create dedicated Gmail: `noreply.linkerai@gmail.com`
2. Enable 2-Factor Authentication
3. Go to Google Account → Security → App passwords
4. Generate app password for "Mail"
5. Use the generated 16-character password

#### 2. SendGrid (Professional - Recommended)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
Username: apikey
Password: [your-sendgrid-api-key]
```

**Setup Steps for SendGrid:**
1. Sign up at sendgrid.com
2. Verify your domain (linkerai.com)
3. Create API Key in Settings
4. Use "apikey" as username, API key as password

#### 3. Other Common Providers
```
# Outlook/Hotmail
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587

# Mailgun
SMTP Host: smtp.mailgun.org
SMTP Port: 587

# Amazon SES
SMTP Host: email-smtp.us-east-1.amazonaws.com
SMTP Port: 587
```

### Recommended for LinkerAI:

**Quick Start (Gmail):**
- Use: `noreply.linkerai@gmail.com`
- SMTP Host: `smtp.gmail.com`
- Takes 5 minutes to set up

**Professional (SendGrid):**
- Use: `noreply@linkerai.com` (your domain)
- SMTP Host: `smtp.sendgrid.net`
- Better deliverability and analytics

## Option 1: Custom SMTP Configuration (Easiest)

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings** → **SMTP Settings**

### Step 2: Configure Custom SMTP

#### For Gmail:
```
Enable Custom SMTP: Yes
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: noreply.linkerai@gmail.com
SMTP Password: [your-16-character-app-password]
Sender Name: LinkerAI Platform
Sender Email: noreply.linkerai@gmail.com
```

#### For SendGrid:
```
Enable Custom SMTP: Yes
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP Username: apikey
SMTP Password: [your-sendgrid-api-key]
Sender Name: LinkerAI Platform
Sender Email: noreply@linkerai.com
```

### Step 3: Update Email Templates
In **Authentication** → **Email Templates**, customize each template:

#### Confirmation Email Template:
```html
<h2>Bienvenue sur LinkerAI !</h2>
<p>Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon compte</a></p>
<p>Code de vérification : {{ .Token }}</p>
<br>
<p>L'équipe LinkerAI</p>
```

#### Magic Link Template:
```html
<h2>Connexion LinkerAI</h2>
<p>Cliquez sur ce lien pour vous connecter :</p>
<p><a href="{{ .ConfirmationURL }}">Se connecter à LinkerAI</a></p>
<br>
<p>L'équipe LinkerAI</p>
```

#### Password Reset Template:
```html
<h2>Réinitialisation de mot de passe - LinkerAI</h2>
<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<br>
<p>L'équipe LinkerAI</p>
```

## Option 2: Custom Email Service with Auth Hooks (Advanced)

### Step 1: Create Edge Function
```bash
supabase functions new send-custom-email
```

### Step 2: Configure Resend/SendGrid
```typescript
// supabase/functions/send-custom-email/index.ts
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  const { user, email_data } = await req.json()
  
  await resend.emails.send({
    from: 'LinkerAI Platform <noreply@linkerai.com>',
    to: [user.email],
    subject: 'Confirmation de compte LinkerAI',
    html: `<h2>Bienvenue sur LinkerAI !</h2>...`
  })
  
  return new Response('OK')
})
```

### Step 3: Set Environment Variables
```bash
# Add to your Supabase project
RESEND_API_KEY=your_resend_key
SEND_EMAIL_HOOK_SECRET=your_webhook_secret
```

### Step 4: Configure Auth Hook
1. Go to **Authentication** → **Hooks**
2. Create new "Send Email" hook
3. Set URL to your Edge Function
4. Generate and save webhook secret

## Recommended Email Templates for LinkerAI

### Professional Email Structure:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LinkerAI</h1>
            <p>Plateforme de mise en relation développeurs-clients</p>
        </div>
        <div class="content">
            <h2>Confirmation de votre compte</h2>
            <p>Merci de vous être inscrit sur LinkerAI !</p>
            <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p>
            <p><a href="{{ .ConfirmationURL }}" class="button">Confirmer mon compte</a></p>
            <p>Ou utilisez ce code : <strong>{{ .Token }}</strong></p>
        </div>
        <div class="footer">
            <p>LinkerAI - Connectons vos projets aux meilleurs développeurs</p>
            <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
    </div>
</body>
</html>
```

## Testing Your Configuration

### Test Email Flow:
1. Create a test user account
2. Check sender name in received emails
3. Verify all email templates display correctly
4. Test different authentication flows:
   - Account confirmation
   - Password reset
   - Magic link login

### Environment Variables Needed:
```bash
# For Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply.linkerai@gmail.com
SMTP_PASS=your_app_password

# For SendGrid SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key

# For external service (optional)
RESEND_API_KEY=your_resend_key
SENDGRID_API_KEY=your_sendgrid_key
```

## Best Practices

1. **Use a dedicated email**: `noreply.linkerai@gmail.com` or `noreply@linkerai.com`
2. **Consistent branding**: Include LinkerAI logo and colors
3. **Clear call-to-action**: Make buttons prominent
4. **Mobile-friendly**: Responsive email templates
5. **Security**: Use app passwords, not main account passwords
6. **Testing**: Test all email flows before production

## Troubleshooting

### Common Issues:
- **Emails in spam**: Configure SPF, DKIM, DMARC records
- **Sender name not showing**: Verify SMTP configuration
- **Templates not updating**: Clear cache and test with new user
- **Links not working**: Check redirect URLs in auth settings
- **Authentication failed**: Check username/password combination
- **Connection timeout**: Verify SMTP host and port

### Verification Steps:
1. Check Supabase logs for email sending errors
2. Verify SMTP credentials are correct
3. Test with multiple email providers (Gmail, Outlook, etc.)
4. Confirm domain reputation if using custom domain
5. Test SMTP connection with tools like telnet or online SMTP testers 