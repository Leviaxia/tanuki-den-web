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

export const sendOrderEmail = async (params: EmailParams) => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            console.warn('EmailJS keys are missing. Skipping email.');
            return;
        }

        const response = await emailjs.send(serviceId, templateId, params as any, publicKey);
        console.log('Email sent successfully!', response.status, response.text);
        return response;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};
