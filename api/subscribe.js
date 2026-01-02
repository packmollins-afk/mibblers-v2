import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // Add to subscriber list in KV
    const subscribers = await kv.get('mibblers_subscribers') || [];
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      await kv.set('mibblers_subscribers', subscribers);
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
  }
}
