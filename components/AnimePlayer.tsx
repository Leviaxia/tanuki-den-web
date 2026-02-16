
import React, { useState } from 'react';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

interface AnimePlayerProps {
    className?: string; // For positioning
    isPlaying: boolean;
    isMuted: boolean;
    currentTitle: string;
    onToggleMute: (e: React.MouseEvent) => void;
    onNext: (e: React.MouseEvent) => void;
}

const AnimePlayer: React.FC<AnimePlayerProps> = ({
    className = '',
    isPlaying,
    isMuted,
    currentTitle,
    onToggleMute,
    onNext
}) => {
    const [showControls, setShowControls] = useState(false);

    // Simple toggle for the local UI dropdown
    const toggleControls = () => setShowControls(!showControls);

    return (
        // Removed 'relative' from here. It must be passed in className if needed (e.g. for static/flex parents).
        // Absolute elements (like the mobile one) don't need 'relative' to be a container for children.
        <div className={`z-[90] font-ghibli-title ${className} flex items-center`}>
            {/* Control Buttons (Reveal on Click) */}
            <div className={`flex items-center gap-2 transition-all duration-300 absolute right-full mr-3 ${showControls ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>

                {/* Mute/Unmute Button */}
                <button
                    onClick={onToggleMute}
                    className="w-8 h-8 rounded-full bg-[#3A332F] text-white border-2 border-[#D4AF37] flex items-center justify-center hover:bg-black transition-colors shadow-md"
                    title={isMuted ? "Activar Sonido" : "Silenciar"}
                >
                    {isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>

                {/* Next Button */}
                <button
                    onClick={onNext}
                    className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#3A332F] border-2 border-[#3A332F] flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    title="Siguiente Canción"
                >
                    <SkipForward size={14} />
                </button>

            </div>

            {/* Main Speaker Icon */}
            <button
                onClick={toggleControls}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 z-10
          ${isPlaying && !isMuted
                        ? 'bg-[#D4AF37] border-[#3A332F] text-[#3A332F] animate-pulse-slow'
                        : 'bg-[#3A332F] border-[#D4AF37] text-[#D4AF37]'}`}
                title={isPlaying ? currentTitle : "Bocina Tanuki"}
            >
                {isMuted ? (
                    <VolumeX size={20} className="md:w-6 md:h-6" />
                ) : (
                    <Volume2 size={20} className="md:w-6 md:h-6" />
                )}
            </button>
        </div>
    );
};

export default AnimePlayer;
