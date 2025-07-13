<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Team Productivity Tracking App</h1>
</a>

<p align="center">
 A modern team productivity tracking application built with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#supabase-setup"><strong>Supabase Setup</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
</p>
<br/>

## Features

- **Authentication & Authorization**

  - Role-based access control (Admin, Manager, Supervisor, Staff)
  - Google OAuth integration
  - Password-based authentication
  - Real-time auth state management

- **User Management**

  - User CRUD operations
  - Department assignment
  - Role management
  - User profiles

- **Voice Recording**

  - Record audio directly in the browser
  - Upload recordings to Supabase Storage
  - Recording metadata management
  - Play/pause/download recordings
  - Role-based recording access

- **Dashboard & Analytics**

  - Supervisor productivity dashboard
  - Department management
  - Target tracking
  - Real-time data updates

- **Technical Stack**
  - [Next.js](https://nextjs.org) with App Router
  - [Supabase](https://supabase.com) for backend services
  - [Tailwind CSS](https://tailwindcss.com) for styling
  - [shadcn/ui](https://ui.shadcn.com/) components
  - [FontAwesome](https://fontawesome.com/) icons
  - TypeScript for type safety

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   ```

   Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally

## Supabase Setup

### Database Schema

This application requires specific database tables and enums. Make sure to create the following in your Supabase project:

#### Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'manager', 'staff');

-- Recording analysis status
CREATE TYPE recording_analysis_status AS ENUM ('in_progress', 'failed', 'success');
```

#### Tables

```sql
-- Departments table
CREATE TABLE departments (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uuid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id BIGINT REFERENCES departments(id),
  email TEXT NOT NULL,
  role user_role DEFAULT 'staff'
);

-- Targets table
CREATE TABLE targets (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_name TEXT NOT NULL,
  target_value BIGINT NOT NULL,
  user_uuid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Recordings table
CREATE TABLE recordings (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_uuid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  duration INTEGER,
  description TEXT,
  transcript TEXT,
  analysis JSONB,
  status recording_analysis_status DEFAULT 'success'
);
```

### Storage Setup

The application uses Supabase Storage for audio file uploads. You need to:

1. **Create Storage Bucket**

   - Go to your Supabase project dashboard
   - Navigate to Storage
   - Create a new bucket named `audio-recordings`
   - Set it as **not public** (files will be accessed via signed URLs)

2. **Configure Storage Policies**
   Add the following Row Level Security (RLS) policies:

   ```sql
   -- Allow users to upload their own recordings
   CREATE POLICY "Users can upload own recordings" ON storage.objects
     FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow users to view their own recordings
   CREATE POLICY "Users can view own recordings" ON storage.objects
     FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow users to delete their own recordings
   CREATE POLICY "Users can delete own recordings" ON storage.objects
     FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow admins and managers to view all recordings
   CREATE POLICY "Admins and managers can view all recordings" ON storage.objects
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM users
         WHERE uuid = auth.uid()
         AND role IN ('admin', 'manager')
       )
     );
   ```

### Row Level Security (RLS)

Enable RLS on all tables and create appropriate policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (uuid = auth.uid());

CREATE POLICY "Admins and managers can view all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.uuid = auth.uid()
      AND u.role IN ('admin', 'manager')
    )
  );

-- Recordings table policies
CREATE POLICY "Users can view own recordings" ON recordings
  FOR SELECT USING (user_uuid = auth.uid());

CREATE POLICY "Users can insert own recordings" ON recordings
  FOR INSERT WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "Users can delete own recordings" ON recordings
  FOR DELETE USING (user_uuid = auth.uid());

CREATE POLICY "Admins and managers can view all recordings" ON recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE uuid = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );
```

### Google OAuth Setup (Optional)

To enable Google sign-in:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Configure authorized domains

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
