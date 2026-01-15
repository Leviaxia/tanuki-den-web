const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    // CORS headers for local development and production
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { cart, userEmail } = JSON.parse(event.body);

        if (!cart || cart.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cart is empty' }) };
        }

        const line_items = cart.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const origin = event.headers.origin || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            customer_email: userEmail,
            metadata: {
                product_count: cart.length.toString()
                // In a real app with Supabase, we would verify prices here
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: session.url }),
        };
    } catch (error) {
        console.error('Stripe Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
