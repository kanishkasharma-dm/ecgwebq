// Vercel serverless function for visitor tracking
// Note: In-memory counter resets on cold starts
// For persistent tracking, integrate with Vercel KV, Upstash, or a database
//
// To get your previous visitor count from Vercel Analytics:
// 1. Go to your Vercel dashboard
// 2. Navigate to Analytics tab
// 3. Check the total page views or unique visitors
// 4. Update the visitorCount below with that number

let visitorCount = 1247; // Starting count - UPDATE THIS with your previous Vercel Analytics count

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Return current count
    return res.status(200).json({ count: visitorCount });
  }

  if (req.method === "POST") {
    // Increment count for new visitor
    visitorCount += 1;
    return res.status(200).json({ count: visitorCount, message: "Visitor counted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

