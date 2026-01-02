import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, quantity, address, notes } = req.body;

  // Validate required fields
  if (!name || !phone || !quantity || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const orderDetails = `
New Mibblers Order!

Customer: ${name}
Phone: ${phone}
Email: ${email || 'Not provided'}
Quantity: ${quantity}
Delivery Address: ${address}
Notes: ${notes || 'None'}

Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
  `.trim();

  try {
    // Send email notification
    await resend.emails.send({
      from: 'Mibblers <orders@newpartyincoming.com>',
      to: process.env.NOTIFY_EMAIL,
      subject: `New Order from ${name} (Qty: ${quantity})`,
      text: orderDetails
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ error: 'Failed to process order' });
  }
}
