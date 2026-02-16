
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Disc, Volume2, VolumeX, Minimize2, Radio } from 'lucide-react';
import { ANIME_PLAYLIST } from '../constants';

const AnimePlayer: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [volume, setVolume] = useState(0.3); // Default lower volume
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const currentTrack = ANIME_PLAYLIST[currentTrackIndex];

    // Handle Volume Change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Handle Play/Pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Autoplay prevented:", error);
                    setIsPlaying(false);
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, currentTrackIndex]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % ANIME_PLAYLIST.length);
        // Determine if we should auto-play next. Usually yes.
        if (!isPlaying) setIsPlaying(true);
    };

    const prevTrack = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + ANIME_PLAYLIST.length) % ANIME_PLAYLIST.length);
        if (!isPlaying) setIsPlaying(true);
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleEnded = () => {
        nextTrack();
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60] font-ghibli-title transition-all duration-500">
            <audio
                ref={audioRef}
                src={currentTrack.url}
                onEnded={handleEnded}
                onError={(e) => console.error("Audio error:", e)}
            />

            {/* Floating Button (Bocina Mode) */}
            {!isExpanded ? (
                <button
                    onClick={toggleExpand}
                    className={`w-14 h-14 rounded-full shadow-2xl border-4 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 group 
            ${isPlaying
                            ? 'bg-[#D4AF37] border-[#3A332F] text-[#3A332F] animate-pulse-slow'
                            : 'bg-[#3A332F] border-[#D4AF37] text-[#D4AF37]'}`}
                >
                    {isPlaying ? (
                        <div className="relative">
                            <Radio size={24} className="animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>
                    ) : (
                        <Disc size={24} className="group-hover:rotate-12 transition-transform" />
                    )}
                </button>
            ) : (
                /* Expanded Player */
                <div className="bg-[#3A332F] text-[#FDF5E6] w-[300px] p-5 rounded-[30px] shadow-2xl border-4 border-[#D4AF37] animate-slide-up relative overflow-hidden">

                    {/* Background Blur Effect */}
                    <div className="absolute inset-0 bg-cover bg-center opacity-10 blur-sm pointer-events-none" style={{ backgroundImage: `url(${currentTrack.cover})` }}></div>

                    {/* Minimize Button */}
                    <button
                        onClick={toggleExpand}
                        className="absolute top-3 right-3 text-[#D4AF37] hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                    >
                        <Minimize2 size={16} />
                    </button>

                    {/* Track Info */}
                    <div className="flex gap-4 items-center mb-4 relative z-10">
                        <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
                            <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">LIVE</span>
                            </div>
                            <h3 className="text-sm font-bold truncate text-[#D4AF37] mb-1 leading-tight">{currentTrack.title}</h3>
                            <p className="text-[10px] text-white/60 truncate uppercase tracking-widest">{currentTrack.anime}</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between px-2 mb-4 relative z-10">
                        <button onClick={prevTrack} className="text-white/60 hover:text-[#D4AF37] transition-colors p-2">
                            <SkipBack size={20} />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 bg-[#D4AF37] text-[#3A332F] rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        >
                            {isPlaying ? <Pause size={24} fill="#3A332F" /> : <Play size={24} fill="#3A332F" className="ml-1" />}
                        </button>

                        <button onClick={nextTrack} className="text-white/60 hover:text-[#D4AF37] transition-colors p-2">
                            <SkipForward size={20} />
                        </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-3 relative z-10 bg-black/20 p-2 rounded-xl">
                        <button onClick={() => setIsMuted(!isMuted)}>
                            {isMuted || volume === 0
                                ? <VolumeX size={16} className="text-red-400" />
                                : <Volume2 size={16} className="text-[#D4AF37]" />
                            }
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                setVolume(parseFloat(e.target.value));
                                setIsMuted(false);
                            }}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimePlayer;
