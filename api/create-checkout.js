import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { cart, userEmail } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const line_items = cart.map(item => ({
            price_data: {
                currency: 'cop',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const origin = req.headers.origin || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            customer_email: userEmail,
            metadata: {
                product_count: cart.length.toString()
            }
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
