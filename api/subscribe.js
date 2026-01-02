import Redis from 'ioredis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function getRedis() {
  const url = process.env.REDIS_URL || process.env.KV_URL;
  return new Redis(url);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Fetch subscribers (admin only)
  if (req.method === 'GET') {
    const password = req.headers.authorization?.trim();
    if (password !== 'broadway123') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const redis = getRedis();
    try {
      const subscribersJson = await redis.get('mibblers_subscribers');
      const subscribers = subscribersJson ? JSON.parse(subscribersJson) : [];
      return res.status(200).json({ subscribers });
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return res.status(500).json({ error: 'Failed to fetch subscribers' });
    } finally {
      redis.disconnect();
    }
  }

  // DELETE - Remove subscriber (admin only)
  if (req.method === 'DELETE') {
    const password = req.headers.authorization?.trim();
    if (password !== 'broadway123') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const redis = getRedis();
    try {
      const subscribersJson = await redis.get('mibblers_subscribers');
      let subscribers = subscribersJson ? JSON.parse(subscribersJson) : [];
      subscribers = subscribers.filter(e => e !== email);
      await redis.set('mibblers_subscribers', JSON.stringify(subscribers));
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      return res.status(500).json({ error: 'Failed to delete subscriber' });
    } finally {
      redis.disconnect();
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const redis = getRedis();

  try {
    // Add to subscriber list in KV
    const subscribersJson = await redis.get('mibblers_subscribers');
    const subscribers = subscribersJson ? JSON.parse(subscribersJson) : [];

    if (!subscribers.includes(email)) {
      subscribers.push(email);
      await redis.set('mibblers_subscribers', JSON.stringify(subscribers));
    }

    // Notify you of new subscriber
    await resend.emails.send({
      from: 'Mibblers <orders@newpartyincoming.com>',
      to: process.env.NOTIFY_EMAIL,
      subject: `New Subscriber: ${email}`,
      text: `Someone subscribed to Mibblers notifications!\n\nEmail: ${email}\nTime: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}\n\nTotal subscribers: ${subscribers.length}`
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error subscribing:', error);
    return res.status(500).json({ error: 'Failed to subscribe' });
  } finally {
    redis.disconnect();
  }
}
