# Supabase Setup Guide for Wiki CUSAT

Follow these steps to get your backend running in 5 minutes.

### 1. Create a Project
1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project** and select an Organization.
3. Name: `Wiki CUSAT`
4. Password: *Choose a strong one*
5. Region: *Select one closest to you (e.g., Mumbai)*
6. Click **Create Project**.

### 2. Setup the Database
1. Once the project is ready, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Paste the contents of your [schema.sql](file:///e:/Wikky%20cusat/schema.sql) file.
4. Click **Run**.
   - This creates the `wiki_cusat_messages` table.
   - It enables Realtime (instantly updates chat when someone sends a msg).
   - It sets up Security Rules (allows anyone to read/write for now).

### 3. Get Your API Keys
1. Click on the **Project Settings** (Gear icon) at the bottom left.
2. Click on **API**.
3. Copy the **Project URL**.
4. Copy the **anon public** key.

### 4. Connect the Code
1. Open [supabase.js](file:///e:/Wikky%20cusat/src/lib/supabase.js).
2. Replace `'YOUR_SUPABASE_URL'` with the URL you copied.
3. Replace `'YOUR_SUPABASE_ANON_KEY'` with the anon key you copied.

---

### 🚀 Recommendation: Use a .env file
Instead of editing `supabase.js` directly, create a file named `.env.local` in `e:\Wikky cusat` and add:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```
The code is already set up to read from these variables!
