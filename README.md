# Goldfinch Notes V2

This version adds real accounts and persistent shared messages using Supabase.

## 1. Create a Supabase project

Create a project at Supabase and open its SQL Editor.

## 2. Run setup.sql

Copy the complete contents of `setup.sql` into Supabase SQL Editor and run it.

This creates:
- `profiles`
- `messages`
- secure Row Level Security policies
- an automatic profile trigger

## 3. Configure authentication

Supabase Auth uses email + password in this version. The username is the public identity attached to the account.

If email confirmation is enabled, a new user must confirm their email before logging in. You can configure this in your Supabase Auth settings.

## 4. Get your browser-safe project credentials

Open your Supabase project's API/Connect settings and copy:
- Project URL
- Publishable key (or legacy anon key)

Do NOT use the secret/service_role key in a browser.

## 5. Edit config.js

Replace:

YOUR_SUPABASE_PROJECT_URL
YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY

with your project's values.

## 6. Upload to GitHub Pages

Put these files directly in the root of your repository:

index.html
style.css
script.js
config.js
setup.sql
README.md

Only the first four are needed by the website. `setup.sql` is just for database setup.

## What V2 currently supports

- Account creation
- Username selection
- Email/password login
- Persistent login session
- Save messages
- View messages from authenticated users
- Delete your own messages
- Mobile-friendly layout
- Character counter
- Logout

## Important security note

The browser-visible Supabase publishable/anon key is expected to be public. Security comes from Supabase Auth + Row Level Security.

Never put a Supabase secret/service_role key into `config.js`.
