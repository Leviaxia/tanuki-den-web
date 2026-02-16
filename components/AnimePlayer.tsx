import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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
    const [volume, setVolume] = useState(0.3);

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

        const attemptPlay = async () => {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error("Autoplay prevented:", error);
                setIsPlaying(false);
            }
        };

        attemptPlay();
    }, []); // Run once on mount

    // Watch for isPlaying state only for toggle
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const nextTrack = () => {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * ANIME_PLAYLIST.length);
        } while (nextIndex === currentTrackIndex && ANIME_PLAYLIST.length > 1);

        setCurrentTrackIndex(nextIndex);
        // Auto-play next track if already playing (or force it)
        setIsPlaying(true);
    };

    return (
        <div className={`z-[90] font-ghibli-title ${className}`}>
            <audio
                ref={audioRef}
                src={currentTrack.url}
                onEnded={nextTrack}
                onError={(e) => console.error("Audio error:", e)}
            />

            <button
                onClick={togglePlay}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 
          ${isPlaying
                        ? 'bg-[#D4AF37] border-[#3A332F] text-[#3A332F] animate-pulse-slow'
                        : 'bg-[#3A332F] border-[#D4AF37] text-[#D4AF37]'}`}
                title={currentTrack.title}
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
