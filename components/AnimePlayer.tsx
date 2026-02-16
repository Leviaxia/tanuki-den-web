import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, SkipForward, Square } from 'lucide-react';
import { ANIME_PLAYLIST } from '../constants';

interface AnimePlayerProps {
    className?: string;
}

const AnimePlayer: React.FC<AnimePlayerProps> = ({ className = '' }) => {
    // Random start index
    const [currentTrackIndex, setCurrentTrackIndex] = useState(() =>
        Math.floor(Math.random() * ANIME_PLAYLIST.length)
    );

    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false); // [NEW] Toggle for control buttons
    const [volume, setVolume] = useState(0.4);

    const audioRef = useRef<HTMLAudioElement>(null);
    const currentTrack = ANIME_PLAYLIST[currentTrackIndex];

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Auto-play on mount
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Use a slight delay to allow page interaction/loading to settle
        const timer = setTimeout(() => {
            audio.play()
                .then(() => setIsPlaying(true))
                .catch((e) => {
                    console.error("Autoplay prevent:", e);
                    setIsPlaying(false);
                });
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    // Sync interactions
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    const toggleControls = () => setShowControls(!showControls);

    const stopMusic = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPlaying(false);
        setShowControls(false); // Hide controls after stopping
    };

    const nextTrack = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * ANIME_PLAYLIST.length);
        } while (nextIndex === currentTrackIndex && ANIME_PLAYLIST.length > 1);

        setCurrentTrackIndex(nextIndex);
        setIsPlaying(true);
    };

    return (
        <div className={`z-[90] font-ghibli-title ${className} relative flex items-center`}>
            <audio
                ref={audioRef}
                src={currentTrack.url}
                onEnded={() => nextTrack()}
                onError={(e) => console.error("Audio error:", e)}
            />

            {/* Control Buttons (Reveal on Click) */}
            <div className={`flex items-center gap-2 transition-all duration-300 absolute right-full mr-3 ${showControls ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>

                {/* Stop Button */}
                <button
                    onClick={stopMusic}
                    className="w-8 h-8 rounded-full bg-[#3A332F] text-white border-2 border-[#D4AF37] flex items-center justify-center hover:bg-black transition-colors shadow-md"
                    title="Apagar"
                >
                    <Square size={12} fill="currentColor" />
                </button>

                {/* Next Button */}
                <button
                    onClick={nextTrack}
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
          ${isPlaying
                        ? 'bg-[#D4AF37] border-[#3A332F] text-[#3A332F] animate-pulse-slow'
                        : 'bg-[#3A332F] border-[#D4AF37] text-[#D4AF37]'}`}
                title={isPlaying ? currentTrack.title : "Encender Bocina"}
            >
                {isPlaying ? (
                    <Volume2 size={20} className="md:w-6 md:h-6" />
                ) : (
                    <VolumeX size={20} className="md:w-6 md:h-6" />
                )}
            </button>
        </div>
    );
};

export default AnimePlayer;
