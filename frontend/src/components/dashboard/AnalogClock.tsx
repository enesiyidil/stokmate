import { useEffect, useState, useRef } from 'react';
import { Cat, Heart, Sparkles } from 'lucide-react';

// --- Components ---

interface CatClickerProps {
    score: number;
    onScoreUpdate: (newScore: number) => void;
    disabled: boolean;
}

function CatClicker({ score, onScoreUpdate, disabled }: CatClickerProps) {
    const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number }[]>([]);
    const [clickPaws, setClickPaws] = useState<{ id: number; x: number; y: number }[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;

        onScoreUpdate(score + 1);

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();

        // 1. Particle Effect
        setClickEffects(prev => [...prev, { id, x, y }]);
        setTimeout(() => {
            setClickEffects(prev => prev.filter(item => item.id !== id));
        }, 800);

        // 2. Paw Tap Animation
        setClickPaws(prev => [...prev, { id, x, y }]);
        setTimeout(() => {
            setClickPaws(prev => prev.filter(item => item.id !== id));
        }, 500); // Paw animation duration
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 border-l border-amber-100/50 h-full w-[180px] shrink-0 bg-gradient-to-b from-white/50 to-amber-50/30">
            <div className="text-center mb-4">
                <div className="flex items-center gap-1.5 justify-center mb-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Mırmır</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-4xl font-black text-amber-900 leading-none drop-shadow-sm font-variant-numeric">{score}</div>
            </div>

            <button
                ref={buttonRef}
                onClick={handleClick}
                disabled={disabled}
                className={`
                    group relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 
                    shadow-lg shadow-orange-500/30 transition-all duration-300 flex items-center justify-center overflow-hidden
                    ${disabled ? 'opacity-50 cursor-not-allowed scale-95 grayscale' : 'hover:shadow-orange-500/50 hover:scale-105 active:scale-95'}
                `}
            >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/20 rotate-45 blur-xl group-hover:translate-y-2 transition-transform duration-700"></div>

                <Cat className="w-8 h-8 text-white relative z-10 drop-shadow-md" />

                <div className="absolute -top-1 -right-1 z-20">
                    <Heart className={`w-3 h-3 text-white fill-white transition-all duration-300 ${clickEffects.length > 0 ? 'scale-125 opacity-100' : 'scale-75 opacity-0'}`} />
                </div>

                {/* Click Particles */}
                {clickEffects.map(effect => (
                    <div
                        key={effect.id}
                        className="absolute z-30 pointer-events-none animate-float-up-fade"
                        style={{ left: effect.x, top: effect.y }}
                    >
                        <span className="text-xs font-bold text-white drop-shadow-md">+1</span>
                    </div>
                ))}

                {/* Paw Tap Animation */}
                {clickPaws.map(paw => (
                    <div
                        key={paw.id}
                        className="absolute z-40 pointer-events-none"
                        style={{
                            left: paw.x,
                            top: paw.y,
                            transform: 'translate(-50%, -50%)' // Center on click
                        }}
                    >
                        <svg width="40" height="40" viewBox="0 0 40 40" className="animate-paw-tap drop-shadow-sm">
                            <path
                                d="M 12 30 Q 8 20 18 10 Q 28 0 32 10 Q 36 20 32 30"
                                fill="white"
                                stroke="#d97706"
                                strokeWidth="2"
                            />
                            <ellipse cx="20" cy="18" rx="4" ry="3" fill="#fbbf24" />
                            <ellipse cx="14" cy="12" rx="2" ry="3" fill="#fbbf24" transform="rotate(-20 14 12)" />
                            <ellipse cx="26" cy="12" rx="2" ry="3" fill="#fbbf24" transform="rotate(20 26 12)" />
                        </svg>
                    </div>
                ))}
            </button>
            <p className="text-[10px] text-amber-700/60 mt-4 text-center font-medium">Stresi azaltmak için sev!</p>
        </div>
    );
}

// Custom Anime Cat Component (Bongo Cat Style)
function BongoCat({ state }: { state: 'idle' | 'enter' | 'smack' | 'leaving' }) {
    const showBubble = state === 'enter' || state === 'smack';

    return (
        <div
            className="absolute bottom-0 right-10 z-30 transition-transform duration-500 ease-spring"
            style={{
                transform: `translateY(${state === 'idle' || state === 'leaving' ? '100%' : '0%'})`
            }}
        >
            <svg width="240" height="150" viewBox="0 0 240 150" className="overflow-visible">
                {/* Speech Bubble */}
                <g
                    transform="translate(140, 40)"
                    style={{
                        opacity: showBubble ? 1 : 0,
                        transform: `translate(140px, 40px) scale(${showBubble ? 1 : 0})`,
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s',
                        transformOrigin: 'bottom left'
                    }}
                >
                    <path
                        d="M 10 0 L 70 0 Q 80 0 80 10 L 80 40 Q 80 50 70 50 L 30 50 L 0 70 L 10 50 L 10 50 Q 0 50 0 40 L 0 10 Q 0 0 10 0"
                        fill="white"
                        stroke="#333"
                        strokeWidth="2"
                    />
                    <text
                        x="40"
                        y="30"
                        textAnchor="middle"
                        fill="#333"
                        fontSize="18"
                        fontFamily="'Comic Sans MS', 'Chalkboard SE', sans-serif"
                        fontWeight="bold"
                        className="select-none"
                    >
                        Hello!
                    </text>
                </g>

                {/* Cat Body/Head Group */}
                <g transform="translate(0, 50)">
                    {/* Head */}
                    <path
                        d="M 40 100 Q 20 100 20 60 Q 20 10 70 10 Q 120 10 120 60 Q 120 100 100 100"
                        fill="white"
                        stroke="#333"
                        strokeWidth="3"
                    />
                    {/* Ears */}
                    <path d="M 30 25 L 20 0 L 50 15" fill="white" stroke="#333" strokeWidth="3" />
                    <path d="M 90 15 L 120 0 L 110 25" fill="white" stroke="#333" strokeWidth="3" />

                    {/* Face */}
                    <circle cx="50" cy="50" r="3" fill="#333" /> {/* Left Eye */}
                    <circle cx="90" cy="50" r="3" fill="#333" /> {/* Right Eye */}
                    <path d="M 65 60 Q 70 65 75 60" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" /> {/* Mouth */}

                    {/* Cheeks */}
                    <ellipse cx="40" cy="65" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />
                    <ellipse cx="100" cy="65" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />
                </g>

                {/* Left Paw (Static on 'table') */}
                <path
                    d="M 30 150 L 30 130 Q 30 120 40 120 Q 50 120 50 130 L 50 150"
                    fill="white"
                    stroke="#333"
                    strokeWidth="3"
                />

                {/* Right Paw (Animated) */}
                <g
                    style={{
                        transformOrigin: '120px 150px',
                        transform: state === 'smack'
                            ? 'rotate(-45deg) translate(-20px, -40px)'
                            : 'rotate(0deg)',
                        transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                >
                    <path
                        d="M 110 150 L 110 120 Q 110 105 125 105 Q 140 105 140 120 L 140 150"
                        fill="white"
                        stroke="#333"
                        strokeWidth="3"
                    />
                    {/* Action Lines for Smack */}
                    {state === 'smack' && (
                        <g opacity="0.8">
                            <path d="M 90 80 L 70 60" stroke="#333" strokeWidth="2" />
                            <path d="M 100 70 L 90 50" stroke="#333" strokeWidth="2" />
                        </g>
                    )}
                </g>
            </svg>
        </div>
    );
}


export function AnalogClock() {
    const [date, setDate] = useState(new Date());
    const [score, setScore] = useState(0);

    // Animation States
    const [catState, setCatState] = useState<'idle' | 'enter' | 'smack' | 'leaving'>('idle');
    const [spinOffset, setSpinOffset] = useState(0);

    // Watch score
    useEffect(() => {
        if (score >= 20 && catState === 'idle') {
            startBongoAnimation();
        }
    }, [score, catState]);

    const startBongoAnimation = () => {
        // 1. Enter: Cat pops up
        setCatState('enter');

        // 2. Smack: After popup, paw hits clock
        setTimeout(() => {
            setCatState('smack');

            // Spin logic triggers on smack
            // Rapid spin!
            setSpinOffset(360 * 5); // 5 full spins

            // 3. Reset Cat (Paw down)
            setTimeout(() => {
                setCatState('enter'); // Back to just visible

                // 4. Leave
                setTimeout(() => {
                    setCatState('leaving');

                    // 5. Cleanup
                    setTimeout(() => {
                        setCatState('idle');
                        setScore(0);
                        setSpinOffset(0); // Silent reset
                    }, 500);

                }, 2000); // Wait a bit after smack to look cute

            }, 200); // Smack is quick

        }, 600); // Enter duration
    };

    useEffect(() => {
        const timer = requestAnimationFrame(function animate() {
            setDate(new Date());
            requestAnimationFrame(animate);
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();

    const smoothSeconds = seconds + milliseconds / 1000;
    const smoothMinutes = minutes + smoothSeconds / 60;
    const smoothHours = hours + smoothMinutes / 60;

    // Apply spin offset to second hand
    const secondDegrees = (smoothSeconds * 6) + spinOffset;
    const minuteDegrees = smoothMinutes * 6;
    const hourDegrees = (smoothHours % 12) * 30;

    return (
        <div className="relative group h-full w-full min-h-[260px] overflow-hidden rounded-2xl">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/40 via-orange-100/40 to-rose-100/40 opacity-50 blur-xl transition-all duration-700 group-hover:opacity-80"></div>

            {/* Main Container */}
            <div className="relative w-full h-full border border-white/60 bg-white/60 shadow-xl backdrop-blur-xl flex items-stretch overflow-hidden">

                {/* Clock Section */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">

                    {/* SVG Clock Face */}
                    <div className="relative w-40 h-40 filter drop-shadow-xl z-20">
                        <svg viewBox="0 0 200 200" className="w-full h-full transform transition-transform duration-500 group-hover:scale-105">
                            <circle cx="100" cy="100" r="95" fill="white" className="stroke-amber-50 stroke-[4]" />
                            <circle cx="100" cy="100" r="90" fill="url(#clockGradient)" opacity="0.1" />

                            <defs>
                                <radialGradient id="clockGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                    <stop offset="0%" stopColor="#FFF7ED" />
                                    <stop offset="100%" stopColor="#FDBA74" />
                                </radialGradient>
                            </defs>

                            {/* Markers */}
                            {Array.from({ length: 12 }).map((_, i) => {
                                const isMajor = i % 3 === 0;
                                return (
                                    <line
                                        key={i}
                                        x1="100"
                                        y1="15"
                                        x2="100"
                                        y2={isMajor ? "25" : "20"}
                                        transform={`rotate(${i * 30} 100 100)`}
                                        stroke={isMajor ? "#78350F" : "#D6D3D1"}
                                        strokeWidth={isMajor ? "2.5" : "1.5"}
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                            {/* Minute Markers */}
                            {Array.from({ length: 60 }).map((_, i) => {
                                if (i % 5 === 0) return null;
                                return (
                                    <line
                                        key={i}
                                        x1="100"
                                        y1="15"
                                        x2="100"
                                        y2="17"
                                        transform={`rotate(${i * 6} 100 100)`}
                                        stroke="#E5E7EB"
                                        strokeWidth="1"
                                    />
                                );
                            })}


                            {/* Hour Hand - No Filter, Thicker */}
                            <line
                                x1="100"
                                y1="100"
                                x2="100"
                                y2="55"
                                stroke="#451a03"
                                strokeWidth="5"
                                strokeLinecap="round"
                                transform={`rotate(${hourDegrees} 100 100)`}
                            />

                            {/* Minute Hand - No Filter, Thicker */}
                            <line
                                x1="100"
                                y1="100"
                                x2="100"
                                y2="35"
                                stroke="#9a3412"
                                strokeWidth="4"
                                strokeLinecap="round"
                                transform={`rotate(${minuteDegrees} 100 100)`}
                            />

                            {/* Second Hand - Animated with Spin */}
                            <line
                                x1="100"
                                y1="115"
                                x2="100"
                                y2="25"
                                stroke="#dc2626"
                                strokeWidth="2"
                                strokeLinecap="round"
                                transform={`rotate(${secondDegrees} 100 100)`}
                                opacity="0.9"
                                style={{
                                    // Massive elastic spin
                                    transition: catState === 'smack' || spinOffset > 0 ? 'transform 2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
                                }}
                            />
                            <circle cx="100" cy="100" r="3" fill="#dc2626" />
                            <circle cx="100" cy="100" r="1.5" fill="white" />
                        </svg>
                    </div>

                    {/* BONGO CAT COMPONENT */}
                    <BongoCat state={catState} />

                    {/* Digital Date Display - Adjusted spacing */}
                    <div className="mt-4 flex flex-col items-center z-10 transition-all duration-300">
                        <div className="px-3 py-1 bg-amber-50/80 rounded-full border border-amber-100 shadow-sm backdrop-blur-sm">
                            <span className="text-xs font-semibold text-amber-800 tabular-nums tracking-wide">
                                {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <span className="text-[10px] text-amber-600/80 font-medium mt-1">
                            {date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>

                <div className="w-px bg-gradient-to-b from-transparent via-amber-200/50 to-transparent"></div>

                {/* Cat Clicker Section */}
                <CatClicker
                    score={score}
                    onScoreUpdate={setScore}
                    disabled={catState !== 'idle'}
                />
            </div>
        </div>
    );
}
