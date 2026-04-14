import emailjs from 'emailjs-com';

// Define the template parameters interface matches your EmailJS template
export interface EmailParams {
    to_name: string; // Admin Name
    from_name: string; // Customer Name
    order_id: string; // Timestamp or UUID
    message: string; // formatted order details
    customer_email: string; // Reply-To
    customer_phone: string; // Contact Number
    payment_proof: string; // Base64 Image string (optional)
    total: string;
}

export interface ReceiptEmailParams {
    customer_email: string;   // To Email (the buyer)
    customer_name: string;    // Buyer's name
    order_id: string;         // Order ID / timestamp
    items: string;            // List of purchased items
    total_amount: string;     // Total amount
    shipping_address: string; // Shipping address
    payment_method: string;   // Payment method label
}

const getKeys = () => ({
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID as string,
    adminTemplateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string,
    receiptTemplateId: import.meta.env.VITE_EMAILJS_RECEIPT_TEMPLATE_ID as string,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string,
});

// Email to admin when an order is placed
export const sendOrderEmail = async (params: EmailParams) => {
    try {
        const { serviceId, adminTemplateId, publicKey } = getKeys();

        if (!serviceId || !adminTemplateId || !publicKey) {
            console.warn('EmailJS keys are missing. Skipping admin email.');
            return;
        }

        // Initialize SDK
        emailjs.init(publicKey);

        const response = await emailjs.send(serviceId, adminTemplateId, params as any, publicKey);
        console.log('Admin email sent!', response.status, response.text);
        return response;
    } catch (error) {
        console.error('Failed to send admin email:', error);
        throw error;
    }
};

// Receipt email to the customer after purchase
export const sendReceiptEmail = async (params: ReceiptEmailParams) => {
    try {
        const { serviceId, receiptTemplateId, publicKey } = getKeys();

        if (!serviceId || !receiptTemplateId || !publicKey) {
            console.warn('EmailJS receipt keys are missing. Skipping receipt email.');
            return;
        }

        // Initialize SDK to ensure the public key is set globally
        emailjs.init(publicKey);

        // Map internal params to common EmailJS variable names to ensure delivery
        // Many templates use to_email/to_name by default.
        const templateParams = {
            ...params,
            to_email: params.customer_email,
            user_email: params.customer_email, // Another common default
            to_name: params.customer_name,
            customer_name: params.customer_name,
            reply_to: params.customer_email
        };

        const response = await emailjs.send(serviceId, receiptTemplateId, templateParams, publicKey);
    } catch (error) {
        console.error('Failed to send receipt email:', error);
        // Don't throw — receipt failure should not block the order completion
    }
};
