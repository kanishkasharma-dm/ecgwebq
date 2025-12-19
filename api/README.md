# Vercel Analytics API Setup

This API endpoint automatically tracks visitors and their countries using Vercel's built-in request headers.

## How It Works

The API uses Vercel's `x-vercel-ip-country` header that is automatically added to every request. This header contains the visitor's country code based on their IP address.

## Features

- ✅ **Automatic Country Detection** - Uses Vercel's built-in geolocation
- ✅ **Live Visitor Tracking** - Counts unique visitors
- ✅ **Country List** - Tracks up to 15 most recent countries
- ✅ **No Configuration Required** - Works out of the box on Vercel

## Usage

The endpoint is available at `/api/analytics` and returns:

```json
{
  "visitors": 1234,
  "countries": ["United States", "India", "United Kingdom"],
  "timestamp": 1703001234567
}
```

## Production Setup

For production with persistent storage, consider:

1. **Vercel KV** (Recommended)
   - Install: `npm install @vercel/kv`
   - Store visitor stats in Redis
   - Prevents data loss on serverless function restarts

2. **Database** (PostgreSQL, MongoDB, etc.)
   - Store visitor data in a database
   - Query aggregated stats

## Note

The current implementation uses in-memory storage for demo purposes. Data resets when serverless functions restart. For production, implement persistent storage using Vercel KV or a database.
