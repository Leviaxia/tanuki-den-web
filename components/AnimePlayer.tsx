
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Minimize2, Speaker } from 'lucide-react';
import { ANIME_PLAYLIST } from '../constants';

const AnimePlayer: React.FC = () => {
    // Random start index
    const [currentTrackIndex, setCurrentTrackIndex] = useState(() =>
        Math.floor(Math.random() * ANIME_PLAYLIST.length)
    );

    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [volume, setVolume] = useState(0.3);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const currentTrack = ANIME_PLAYLIST[currentTrackIndex];

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(error => {
                console.error("Autoplay prevented:", error);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
    }, [isPlaying, currentTrackIndex]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const nextTrack = () => {
        // Random Shuffle Logic (Never repeat current instantly if possible)
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * ANIME_PLAYLIST.length);
        } while (nextIndex === currentTrackIndex && ANIME_PLAYLIST.length > 1);

        setCurrentTrackIndex(nextIndex);
        if (!isPlaying) setIsPlaying(true);
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        // Fixed to LEFT side (bottom-4 left-4) and high z-index
        <div className="fixed bottom-4 left-4 z-[100] font-ghibli-title transition-all duration-500">
            <audio
                ref={audioRef}
                src={currentTrack.url}
                onEnded={nextTrack}
                onError={(e) => console.error("Audio error:", e)}
            />

            {/* Floating Button (Speaker/Volume Style) */}
            {!isExpanded ? (
                <button
                    onClick={toggleExpand}
                    className={`w-12 h-12 rounded-full shadow-2xl border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 
            ${isPlaying
                            ? 'bg-[#D4AF37] border-[#3A332F] text-[#3A332F] animate-pulse-slow'
                            : 'bg-[#3A332F] border-[#D4AF37] text-[#D4AF37]'}`}
                >
                    {isPlaying ? (
                        <div className="relative">
                            <Volume2 size={24} className="animate-pulse" />
                        </div>
                    ) : (
                        <Speaker size={24} />
                    )}
                </button>
            ) : (
                /* Expanded Player */
                <div className="bg-[#3A332F] text-[#FDF5E6] w-[280px] p-4 rounded-[20px] shadow-2xl border-4 border-[#D4AF37] animate-slide-up relative overflow-hidden backdrop-blur-md">
                    {/* Background Art */}
                    <div className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none" style={{ backgroundImage: `url(${currentTrack.cover})` }}></div>

                    {/* Close/Minimize */}
                    <button
                        onClick={toggleExpand}
                        className="absolute top-2 right-2 text-[#D4AF37] hover:text-white p-1"
                    >
                        <Minimize2 size={16} />
                    </button>

                    <div className="relative z-10 flex gap-3 items-center mb-3">
                        <div className={`w-14 h-14 rounded-full border-2 border-[#D4AF37] overflow-hidden shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
                            <img src={currentTrack.cover} alt="Art" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold truncate text-[#D4AF37]">{currentTrack.title}</h3>
                            <p className="text-[10px] text-white/70 truncate">{currentTrack.anime}</p>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between px-2">
                        <button onClick={() => setIsMuted(!isMuted)}>
                            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>

                        {/* Simple Play/Next Controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 bg-[#D4AF37] text-[#3A332F] rounded-full flex items-center justify-center hover:scale-110 shadow-lg"
                            >
                                {isPlaying ? <Pause size={18} fill="#3A332F" /> : <Play size={18} fill="#3A332F" className="ml-1" />}
                            </button>
                            <button onClick={nextTrack} className="text-white/80 hover:text-white">
                                <SkipForward size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimePlayer;
