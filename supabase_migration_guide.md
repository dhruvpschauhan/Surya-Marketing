# Migrating QuoteForge to Supabase

This guide will walk you through migrating your local SQLite database to a cloud-hosted PostgreSQL database on **Supabase**.

> [!NOTE]
> QuoteForge currently uses `sqlite+aiosqlite`. To use Supabase (which is PostgreSQL), we need to install the PostgreSQL async driver (`asyncpg`) and change the connection string.

## Step 1: Create a Supabase Project

1. Go to [database.new](https://database.new) and sign in/sign up.
2. Create a new project (name it `QuoteForge` or similar) and generate a secure database password. **Save this password**.
3. Wait a few minutes for the database to finish provisioning.
4. Once ready, go to **Project Settings** (the gear icon) -> **Database**.
5. Scroll down to the **Connection string** section, select **URI**, and uncheck "Use connection pooling" for now to get the direct connection string. 
   * It will look like this: `postgresql://postgres.[your-id]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`

## Step 2: Install PostgreSQL Drivers

Your backend currently only knows how to talk to SQLite. We need to teach it to talk to PostgreSQL.

1. Open a new terminal in your `backend` folder.
2. Run the following command:
```bash
pip install asyncpg psycopg2-binary
```
3. Add these to your `requirements.txt` file so they are saved for the future.

## Step 3: Update your `.env` File

1. Open `e:\SM_Quote_System\backend\.env`.
2. Replace your existing `DATABASE_URL` with the new Supabase one. **Crucially, change `postgresql://` to `postgresql+asyncpg://`** so SQLAlchemy knows to use the async driver.

```env
# Old SQLite connection
# DATABASE_URL=sqlite+aiosqlite:///./quoteforge.db

# New Supabase connection (replace [YOUR-PASSWORD] with your actual password)
DATABASE_URL=postgresql+asyncpg://postgres.[your-id]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

## Step 4: Start the Backend (Creates Tables)

Since QuoteForge uses SQLAlchemy's `create_all` on startup, simply restarting your backend will automatically create all the required tables in your new Supabase database!

1. Close any running `Start-QuoteForge.bat` windows.
2. Run `Start-QuoteForge.bat` again.
3. Check the Supabase Dashboard -> **Table Editor**. You should now see your tables (`dealership`, `discounts`, `products`, `quote_sessions`).

> [!WARNING]  
> Your Supabase database will be **empty**. Your local products, quotes, and dealer profile won't automatically transfer over.

## Step 5: Repopulate Data

Because migrating raw data between SQLite and Postgres can be messy due to dialect differences, the fastest and safest way to get your data back is to use the QuoteForge Admin Panel:

1. **Dealer Profile:** Go to Settings and re-enter your GST, Name, and Mobile Number.
2. **Master Discounts:** Go to Admin -> Discounts, upload your Excel discount sheet (or set them manually), and hit "Save All".
3. **Products:** Go to Admin -> Database, and click "Upload Products Excel" to re-seed all your Apollo, Supreme, Astral, and Ashirvad products.

You are now fully connected to the cloud! 🎉
