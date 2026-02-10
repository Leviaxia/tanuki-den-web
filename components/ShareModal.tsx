
import React from 'react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface ShareModalProps {
    product: Product;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ product, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    // Base URL + Deep Link
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
    const message = `Mira este increíble producto de Tanuki Den: ${product.name}`;
    const fullText = `${message} ${shareUrl}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        {
            name: 'WhatsApp',
            color: '#25D366',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>,
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`
        },
        {
            name: 'Facebook',
            color: '#1877F2',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v2.225l-.333.006c-2.168.069-3.461 1.034-3.461 3.118l-.002 1.911h4.135l-.535 3.667h-3.596v7.98c.48.06 1.19.06 1.701.06 8.837 0 16-7.163 16-16s-7.163-16-16-16-16 7.163-16 16c0 8.837 7.163 16 16 16 .42 0 1.1-.013 1.524-.07z" /></svg>,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(message)}`
        },
        {
            name: 'Telegram',
            color: '#26A5E4',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>,
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`
        },
        {
            name: 'Twitter (X)',
            color: '#000000',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'Instagram',
            color: '#E1306C',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
            action: 'copy' // No web share URL
        },
        {
            name: 'TikTok',
            color: '#000000',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 1.36-.02 2.72-.95 3.84-1.04 1.25-2.82 2.11-4.48 2.05-2.27-.08-4.39-1.69-5.04-3.86-.71-2.36.03-5.18 2.37-6.49 1.19-.66 2.58-.81 3.91-.4v4.13c-1.29-.53-3.13-.23-4.08.97-.6 1.05-.28 2.55.77 3.25 1 .68 2.45.62 3.32-.42.54-.64.51-1.46.5-2.26 0-3.69.01-7.39 0-11.08-.01-1.05-.01-2.11 0-3.16z" /></svg>,
            action: 'copy'
        },
        {
            name: 'SMS',
            color: '#3A332F',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>,
            url: `sms:?body=${encodeURIComponent(fullText)}`
        },
        {
            name: 'Discord',
            color: '#5865F2',
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>,
            action: 'copy'
        }
    ];

    return (
        <div className="fixed inset-0 z-[3000] bg-[#3A332F]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FDF5E6] w-full max-w-sm rounded-[30px] p-6 relative animate-pop border-4 border-white shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-[#3A332F]/10 rounded-full transition-colors"><X size={24} /></button>

                <h3 className="text-2xl font-ghibli-title text-[#3A332F] text-center mb-6 uppercase">Compartir Tesoro</h3>

                <div className="flex gap-4 mb-6 bg-white p-3 rounded-2xl border border-[#E6D5B8]">
                    <img src={product.image} className="w-16 h-16 rounded-xl object-cover border border-[#E6D5B8]" alt={product.name} />
                    <div>
                        <h4 className="font-bold text-[#3A332F] text-sm line-clamp-2 leading-tight">{product.name}</h4>
                        <p className="text-[#C14B3A] font-ghibli-title text-sm mt-1">Tanuki Den</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    {shareOptions.map((opt) => (
                        <button
                            key={opt.name}
                            onClick={() => {
                                if ('url' in opt) {
                                    window.open(opt.url, '_blank');
                                } else {
                                    copyToClipboard();
                                }
                            }}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: opt.color }}
                            >
                                {opt.icon}
                            </div>
                            <span className="text-[10px] font-bold text-[#3A332F]">{opt.name}</span>
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <div className="w-full bg-white border-2 border-[#E6D5B8] rounded-xl px-3 py-3 text-xs text-[#3A332F]/60 truncate pr-10">
                        {shareUrl}
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[#FDF5E6] rounded-lg transition-colors text-[#3A332F]"
                    >
                        {copied ? <CheckCircle2 size={16} className="text-[#81C784]" /> : <Copy size={16} />}
                    </button>
                    {copied && <span className="absolute -top-8 right-0 bg-[#3A332F] text-white text-[10px] px-2 py-1 rounded-md animate-fade-in">¡Copiado!</span>}
                </div>

            </div>
        </div>
    );
};

export default ShareModal;
