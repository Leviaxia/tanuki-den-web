import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, Lock, Gift, Star, Flame, Map, ShoppingBag, UserCheck } from 'lucide-react';
import { Mission, UserMission } from '../types';
import { formatCurrency } from '../src/lib/utils'; // Optional if needed for coins display

interface MissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userCoins: number;
    missions: Mission[];
    userMissions: Record<string, UserMission>;
    onClaimAttributes: (missionId: string) => void;
}

const MissionsModal: React.FC<MissionsModalProps> = ({
    isOpen, onClose, userCoins, missions, userMissions, onClaimAttributes
}) => {
    const [activeTab, setActiveTab] = useState<'missions' | 'rewards'>('missions');

    // Icon mapping
    const getIcon = (iconName: string, completed: boolean) => {
        const className = `w-8 h-8 ${completed ? 'text-white' : 'text-[#3A332F]/40'}`;
        switch (iconName) {
            case 'UserCheck': return <UserCheck className={className} />;
            case 'Flame': return <Flame className={className} />;
            case 'Map': return <Map className={className} />;
            case 'ShoppingBag': return <ShoppingBag className={className} />;
            case 'Star': return <Star className={className} />;
            default: return <Trophy className={className} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] bg-[#3A332F]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#FDF5E6] w-full max-w-4xl h-[85vh] rounded-[40px] border-4 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.3)] relative flex flex-col overflow-hidden animate-pop">

                {/* Header */}
                <div className="bg-[#3A332F] p-6 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce-subtle">
                            <Trophy className="text-white w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-ghibli-title text-[#FDF5E6] uppercase tracking-widest text-shadow-sm">Misiones del Clan</h2>
                            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm uppercase tracking-wider">
                                <span className="text-white/60">Tu Tesoro:</span>
                                <span className="bg-white/10 px-3 py-1 rounded-full border border-[#D4AF37]/30 flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#D4AF37] animate-pulse"></div>
                                    {userCoins} Tanuki Coins
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                        <X size={28} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-4 border-[#3A332F]/10 bg-white">
                    <button
                        onClick={() => setActiveTab('missions')}
                        className={`flex-1 py-4 font-ghibli-title uppercase tracking-widest text-lg transition-all ${activeTab === 'missions' ? 'bg-[#C14B3A] text-white shadow-inner' : 'text-[#3A332F]/60 hover:bg-[#FDF5E6]'}`}
                    >
                        Misiones Activas
                    </button>
                    {/* Placeholder for future rewards tab */}
                    {/* <button 
                        onClick={() => setActiveTab('rewards')}
                        className={`flex-1 py-4 font-ghibli-title uppercase tracking-widest text-lg transition-all ${activeTab === 'rewards' ? 'bg-[#C14B3A] text-white shadow-inner' : 'text-[#3A332F]/60 hover:bg-[#FDF5E6]'}`}
                    >
                        Recompensas
                    </button> */}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-[url('/assets/pattern_bg.png')]">
                    {missions.map(mission => {
                        const userMission = userMissions[mission.id] || { progress: 0, completed: false, claimed: false };
                        const progressPercent = Math.min(100, (userMission.progress / mission.target) * 100);

                        return (
                            <div key={mission.id} className={`relative bg-white rounded-[30px] p-6 border-4 transition-all duration-300 group ${userMission.completed ? 'border-[#D4AF37] shadow-[0_10px_0_0_#D4AF37]' : 'border-[#3A332F]/10 hover:border-[#3A332F]/30 hover:transform hover:-translate-y-1'}`}>
                                <div className="flex items-center gap-6">
                                    {/* Medal/Icon */}
                                    <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center border-4 flex-shrink-0 transition-all duration-500 overflow-hidden relative ${userMission.completed ? 'bg-[#D4AF37] border-[#FDF5E6] shadow-lg rotate-3' : 'bg-[#3A332F]/5 border-[#3A332F]/10 grayscale'}`}>
                                        {userMission.completed && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 animate-shine"></div>}
                                        {getIcon(mission.icon, userMission.completed)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`font-ghibli-title text-xl uppercase ${userMission.completed ? 'text-[#D4AF37]' : 'text-[#3A332F]'}`}>{mission.title}</h3>
                                                <p className="text-[#8C8279] text-xs font-bold leading-relaxed">{mission.description}</p>
                                            </div>
                                            {userMission.claimed ? (
                                                <span className="bg-[#81C784]/20 text-[#2E7D32] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircle2 size={12} /> Completado
                                                </span>
                                            ) : userMission.completed ? (
                                                <button
                                                    onClick={() => onClaimAttributes(mission.id)}
                                                    className="bg-[#D4AF37] text-white px-6 py-2 rounded-full font-ghibli-title text-sm uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all animate-pulse"
                                                >
                                                    Reclamar {mission.reward} 🪙
                                                </button>
                                            ) : (
                                                <span className="bg-[#3A332F]/5 text-[#3A332F]/40 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Lock size={12} /> {mission.reward} 🪙
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-[#3A332F]/40 tracking-wider">
                                                <span>Progreso</span>
                                                <span>{userMission.progress} / {mission.target}</span>
                                            </div>
                                            <div className="h-4 bg-[#3A332F]/5 rounded-full overflow-hidden border border-[#3A332F]/5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${userMission.completed ? 'bg-[#D4AF37]' : 'bg-[#C14B3A]'}`}
                                                    style={{ width: `${progressPercent}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                .text-shadow-sm { text-shadow: 2px 2px 0px rgba(0,0,0,0.2); }
            `}</style>
        </div>
    );
};

export default MissionsModal;
