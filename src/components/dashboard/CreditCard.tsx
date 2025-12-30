import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';
import { Wifi } from 'lucide-react';

const CreditCard = () => {
    const navigate = useNavigate();
    const { userProfile } = useStore();

    const last4 = userProfile?.cardLast4 || '8888';
    const name = userProfile?.name || 'Card Holder';

    return (
        <div
            className="hover-3d w-full h-full cursor-pointer group perserve-3d shadow-xl rounded-2xl"
            onClick={() => navigate('/cashflow')}
        >
            {/* CARD CONTENT */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                {/* Metallic Background */}
                <div className="absolute inset-0 bg-neutral-900">
                    {/* Metallic Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-black to-gray-900 opacity-90"></div>
                    {/* Brushed Metal Texture imitation */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
                    {/* Sheen/Reference */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                </div>

                {/* Card Elements */}
                <div className="relative z-10 p-6 flex flex-col justify-between h-full font-mono text-white/90">

                    {/* Top Row: Chip & Wifi */}
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center">
                            {/* Chip */}
                            <div className="w-12 h-9 bg-yellow-500/80 rounded-md border border-yellow-400/50 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md"></div>
                                {/* Chip Lines */}
                                <div className="w-full h-[1px] bg-black/30 absolute top-1/2 -translate-y-1/2"></div>
                                <div className="h-full w-[1px] bg-black/30 absolute left-1/2 -translate-x-1/2"></div>
                                <div className="w-8 h-6 border border-black/20 rounded-sm"></div>
                            </div>
                            <Wifi className="rotate-90 opacity-70" size={24} />
                        </div>
                        {/* Mastercard Logo (Simplified CSS/SVG) */}
                        <div className="flex relative">
                            <div className="w-8 h-8 rounded-full bg-red-600/90 mix-blend-screen"></div>
                            <div className="w-8 h-8 rounded-full bg-yellow-500/90 mix-blend-screen -ml-4"></div>
                        </div>
                    </div>

                    {/* Middle: Number */}
                    <div className="mt-4">
                        <div className="text-xl tracking-[0.2em] flex items-center gap-4 opacity-90 shadow-black drop-shadow-md">
                            <span>****</span>
                            <span>****</span>
                            <span>****</span>
                            <span className="text-2xl">{last4}</span>
                        </div>
                    </div>

                    {/* Bottom: Details */}
                    <div className="flex justify-between items-end mt-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] opacity-50 uppercase tracking-widest">Card Holder</span>
                            <span className="font-semibold tracking-wider text-sm truncate max-w-[180px]">{name.toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] opacity-50 uppercase tracking-widest">Expires</span>
                            <span className="font-semibold tracking-wider text-sm">12/05</span>
                        </div>
                    </div>

                </div>

                {/* Holographic Sheen on Hover (optional) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
            </div>

            {/* 8 Empty Divs for DaisyUI Hover-3D Effect */}
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
};

export default CreditCard;
