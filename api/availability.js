import Redis from 'ioredis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function getRedis() {
  const url = process.env.REDIS_URL || process.env.KV_URL;
  return new Redis(url);
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redis = getRedis();

  try {
    // GET - Check availability
    if (req.method === 'GET') {
      try {
        const available = await redis.get('mibblers_available');
        return res.status(200).json({ available: available === 'true' });
      } catch (error) {
        console.error('Error reading availability:', error);
        return res.status(200).json({ available: false });
      }
    }

    // POST - Toggle availability (admin only)
    if (req.method === 'POST') {
      const password = req.headers.authorization?.trim();

      if (password !== 'broadway123') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      try {
        const { available } = req.body;
        const wasAvailable = await redis.get('mibblers_available');
        await redis.set('mibblers_available', available === true ? 'true' : 'false');

        // Notify subscribers when Mibblers become available
        if (available === true && wasAvailable !== 'true') {
          const subscribersJson = await redis.get('mibblers_subscribers');
          const subscribers = subscribersJson ? JSON.parse(subscribersJson) : [];

          if (subscribers.length > 0) {
            await resend.emails.send({
              from: 'Mibblers <orders@newpartyincoming.com>',
              to: subscribers,
              subject: 'Mibblers are Available!',
              html: `
                <div style="font-family: sans-serif; text-align: center; padding: 40px;">
                  <h1 style="color: #a855f7;">Mibblers are Ready!</h1>
                  <p style="font-size: 18px; color: #555;">Fresh baked Mibblers are now available for order.</p>
                  <a href="https://newpartyincoming.com" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b, #feca57); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px;">Order Now</a>
                  <p style="margin-top: 30px; color: #888; font-size: 14px;">Get them before they're gone!</p>
                </div>
              `
            });
          }
        }

        return res.status(200).json({ success: true, available: available === true });
      } catch (error) {
        console.error('Error updating availability:', error);
        return res.status(500).json({ error: 'Failed to update availability' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } finally {
    redis.disconnect();
  }
}
