"use client";

import { AlertTriangle, ChevronDown, ChevronUp, PhoneCall, Info } from "lucide-react";
import { useState } from "react";

export default function FirstAidBanner() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full bg-yellow-500 text-yellow-950 rounded-2xl shadow-lg border-2 border-yellow-600 overflow-hidden mb-6 relative z-30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between font-black text-left hover:bg-yellow-400 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <AlertTriangle size={28} className={!isOpen ? "animate-pulse delay-75" : ""} />
                    <span className="text-sm md:text-base leading-tight uppercase tracking-wide">
                        ¿No eres paramédico?<br />
                        <span className="underline decoration-2 underline-offset-2">Toca aquí para ver cómo ayudar.</span>
                    </span>
                </div>
                {isOpen ? <ChevronUp size={28} className="shrink-0" /> : <ChevronDown size={28} className="shrink-0" />}
            </button>

            {isOpen && (
                <div className="px-5 pb-5 pt-2 space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <a
                        href="tel:911"
                        className="w-full bg-red-600 text-white flex items-center justify-center gap-3 py-4 rounded-xl font-black text-2xl hover:bg-red-700 transition-colors shadow-xl"
                    >
                        <PhoneCall size={32} className="animate-pulse" /> LLAMAR AL 911
                    </a>

                    <div className="bg-yellow-400/40 p-5 rounded-xl border border-yellow-600/30">
                        <ul className="space-y-4 font-bold text-base md:text-lg">
                            <li className="flex gap-3 items-start">
                                <span className="text-red-700 text-xl font-black shrink-0 mt-0.5">❌</span>
                                <span><span className="text-red-800 font-black">NO</span> muevas al accidentado</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-red-700 text-xl font-black shrink-0 mt-0.5">❌</span>
                                <span><span className="text-red-800 font-black">NO</span> retires el casco</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-blue-800 text-xl font-black shrink-0 mt-0.5">👁️</span>
                                <span>Verifica si respira y está consciente</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-red-700 text-xl font-black shrink-0 mt-0.5">🩸</span>
                                <span>Si hay sangrado, presiona con un trapo limpio</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-green-800 text-xl font-black shrink-0 mt-0.5">🧘</span>
                                <span>Mantén la calma y espera a los paramédicos</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="text-yellow-900 text-xl font-black shrink-0 mt-0.5">📱</span>
                                <span>Comparte esta pantalla con los paramédicos cuando lleguen</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
