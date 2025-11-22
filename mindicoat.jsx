import React, { useState, useEffect, useRef } from 'react';
import { Trophy, User, HelpCircle, Play, Settings, Users, Crown, Star, X, ScrollText, ChevronRight, ChevronLeft } from 'lucide-react';

// --- Game Constants & Utilities ---
const SUITS = ['S', 'H', 'D', 'C'];
const SUIT_ICONS = {
    'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣'
};
const SUIT_COLORS = {
    'S': 'text-slate-900', 
    'H': 'text-red-600', 
    'D': 'text-red-600', 
    'C': 'text-slate-900'
};

// Helper to generate deck
const createDeck = (numPlayers) => {
    let deck = [];
    const numDecks = numPlayers >= 6 ? 2 : 1;
    
    // Define valid ranks based on player count to ensure 9 cards/player
    let validRanks = [];
    if (numPlayers === 6) {
        validRanks = ['8', '9', '10', 'J', 'Q', 'K', 'A'];
    } else {
        validRanks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    }

    for(let d=0; d<numDecks; d++) {
        SUITS.forEach(suit => {
            validRanks.forEach(rank => {
                // Logic for 6 Players: Remove 2 specific cards to go from 56 -> 54
                if (numPlayers === 6 && d === 1 && rank === '8' && (suit === 'C' || suit === 'S')) {
                    return;
                }

                let value = parseInt(rank);
                if (rank === 'J') value = 11;
                if (rank === 'Q') value = 12;
                if (rank === 'K') value = 13;
                if (rank === 'A') value = 14;

                deck.push({
                    suit, rank, value,
                    id: `${rank}${suit}-${d}`,
                    deckIndex: d
                });
            });
        });
    }
    
    // Shuffle (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

// Helper: Get Trick Winner
const getTrickWinner = (trick, trumpSuit) => {
    if (trick.length === 0) return -1;
    
    let winnerIdx = 0;
    let highCard = trick[0].card;
    const leadSuit = highCard.suit;

    for (let i = 1; i < trick.length; i++) {
        const current = trick[i].card;
        
        // Check Trump logic
        const isTrump = current.suit === trumpSuit;
        const highIsTrump = highCard.suit === trumpSuit;

        if (isTrump && !highIsTrump) {
            highCard = current;
            winnerIdx = i;
        } else if (isTrump === highIsTrump) {
            if (current.suit === highCard.suit) {
                 if (current.value > highCard.value) {
                     highCard = current;
                     winnerIdx = i;
                 }
            } else if (current.suit === leadSuit && highCard.suit !== leadSuit && !highIsTrump) {
                highCard = current;
                winnerIdx = i;
            }
        }
    }
    return trick[winnerIdx].playerId;
};

// --- Components ---

const Card = ({ card, onClick, className = "", faceDown = false, disabled = false, size = "md" }) => {
    if (!card) return null;
    
    // Styling constants
    const isRed = card.suit === 'H' || card.suit === 'D';
    const sizeClasses = size === "sm" ? "w-14 h-20 text-sm rounded border" : "w-20 h-28 text-lg md:w-24 md:h-36 md:text-xl rounded-lg border-2";
    const suitSize = size === "sm" ? "text-xl" : "text-2xl md:text-4xl";
    
    if (faceDown) {
        return (
            <div className={`card bg-indigo-900 border-indigo-400 flex items-center justify-center ${sizeClasses} ${className} shadow-xl`}>
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <Crown size={size === 'sm' ? 16 : 24} className="text-indigo-300 absolute opacity-50" />
            </div>
        );
    }

    return (
        <div 
            onClick={() => !disabled && onClick && onClick(card)} 
            className={`
                card flex flex-col items-center justify-between p-1 md:p-2 
                bg-orange-50 border-slate-300
                ${sizeClasses} 
                ${isRed ? 'text-red-600' : 'text-slate-900'} 
                ${className} 
                shadow-lg
                ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-yellow-400'}
            `}
        >
            <div className="self-start font-bold leading-none font-mono">{card.rank}</div>
            <div className={`${suitSize} drop-shadow-sm`}>{SUIT_ICONS[card.suit]}</div>
            <div className="self-end font-bold leading-none rotate-180 font-mono">{card.rank}</div>
        </div>
    );
};

const Fireworks = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.velocity = {
                    x: (Math.random() - 0.5) * 8,
                    y: (Math.random() - 0.5) * 8
                };
                this.alpha = 1;
                this.friction = 0.95;
            }

            draw() {
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                this.velocity.x *= this.friction;
                this.velocity.y *= this.friction;
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.alpha -= 0.01;
            }
        }

        const createFirework = (x, y) => {
            const colors = ['#FFD700', '#FF4500', '#00BFFF', '#32CD32', '#FF69B4'];
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
            }
        };

        const animate = () => {
            requestAnimationFrame(animate);
            if(!ctx) return;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle, index) => {
                if (particle.alpha > 0) {
                    particle.update();
                    particle.draw();
                } else {
                    particles.splice(index, 1);
                }
            });

            if (Math.random() < 0.05) {
                createFirework(Math.random() * canvas.width, Math.random() * canvas.height * 0.5);
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[100]" />;
};

// --- Log Panel Component ---
const LogPanel = ({ messages, isOpen, setIsOpen }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    return (
        <div className={`absolute right-0 top-20 z-50 flex transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[260px]'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-800 text-yellow-400 p-2 rounded-l-lg border-y border-l border-yellow-600/50 hover:bg-slate-700 h-10 mt-2 shadow-lg flex items-center"
            >
                {isOpen ? <ChevronRight size={20}/> : <ScrollText size={20}/>}
            </button>
            <div className="w-[260px] h-[60vh] bg-slate-900/95 backdrop-blur-md border-l border-y border-yellow-600/30 rounded-bl-lg shadow-2xl flex flex-col">
                <div className="p-3 border-b border-white/10 bg-slate-800/50 font-bold text-yellow-500 flex items-center gap-2">
                    <ScrollText size={16} /> Game Log
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 hand-scroll">
                    {messages.length === 0 && <div className="text-slate-500 text-xs text-center italic mt-4">Game started...</div>}
                    {messages.map((msg, i) => (
                        <div key={i} className="text-xs text-slate-300 border-b border-white/5 pb-2 last:border-0">
                            <span className="text-yellow-600 mr-1">›</span> {msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Game Container ---

export default function App() {
    // --- State ---
    const [view, setView] = useState('LOBBY');
    const [numPlayers, setNumPlayers] = useState(4);
    
    const [hands, setHands] = useState([]);
    const [trick, setTrick] = useState([]); 
    const [turn, setTurn] = useState(0); 
    const [trump, setTrump] = useState({ suit: null, revealed: false });
    
    const [capturedTens, setCapturedTens] = useState({ team0: [], team1: [] });
    
    const [messages, setMessages] = useState([]);
    const [isLogOpen, setIsLogOpen] = useState(true); // Log panel state
    const [phase, setPhase] = useState('SETUP'); 
    const [winnerData, setWinnerData] = useState(null);
    
    const gameStateRef = useRef({ turn, trick, trump, phase, hands, numPlayers, capturedTens });

    useEffect(() => {
        gameStateRef.current = { turn, trick, trump, phase, hands, numPlayers, capturedTens };
    }, [turn, trick, trump, phase, hands, numPlayers, capturedTens]);

    // --- Initialization ---
    const startGame = (n) => {
        setNumPlayers(n);
        const deck = createDeck(n);
        const cardsPerPlayer = deck.length / n;
        const newHands = [];
        for(let i=0; i<n; i++) {
            newHands.push(deck.slice(i*cardsPerPlayer, (i+1)*cardsPerPlayer).sort((a,b) => {
                 if (a.suit === b.suit) return a.value - b.value;
                 return a.suit.localeCompare(b.suit);
            }));
        }
        
        setHands(newHands);
        setCapturedTens({ team0: [], team1: [] });
        setTrick([]);
        setWinnerData(null);
        setMessages([]);
        
        // RANDOM TRUMP SELECTION (Hidden)
        const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
        setTrump({ suit: randomSuit, revealed: false });
        
        const firstTurn = 0; 
        setTurn(firstTurn); 
        
        addLog(`Game Started! ${n} Players. Trump Hidden.`);
        setPhase('PLAY'); 
        setView('GAME');
        setIsLogOpen(true); // Open logs at start
    };

    const addLog = (msg) => {
        setMessages(prev => [...prev, msg]); // Append to end for scrollable list
    };

    // --- Bot & Game Loop ---
    useEffect(() => {
        if (view !== 'GAME' || winnerData) return;
        
        const runBot = async () => {
            const { turn, phase, hands, trump, trick } = gameStateRef.current;
            
            if (turn === 0) return;

            await new Promise(r => setTimeout(r, 1000));
            
            if (phase === 'PLAY') {
                const hand = hands[turn];
                if (!hand) return;

                let validCards = [];
                
                if (trick.length === 0) {
                    validCards = hand;
                } else {
                    const leadSuit = trick[0].card.suit;
                    validCards = hand.filter(c => c.suit === leadSuit);
                }

                if (validCards.length === 0 && !trump.revealed && trick.length > 0) {
                    addLog(`Player ${turn} revealed the Trump: ${SUIT_ICONS[trump.suit]} ${trump.suit}!`);
                    setTrump(prev => ({ ...prev, revealed: true }));
                }

                if (validCards.length === 0) validCards = hand;

                let cardToPlay = validCards[0];
                if (validCards.length > 1) {
                    validCards.sort((a,b) => b.value - a.value);
                    cardToPlay = validCards[0];
                }
                
                handlePlayCard(turn, cardToPlay);
            }
        };

        runBot();

    }, [turn, phase, trick.length, trump.revealed]); 

    // --- Actions ---

    const handlePlayCard = (playerId, card) => {
        const newHands = [...hands];
        const handIdx = newHands[playerId].findIndex(c => c.id === card.id);
        if (handIdx === -1) return; 
        newHands[playerId].splice(handIdx, 1);
        setHands(newHands);

        const newTrick = [...trick, { playerId, card }];
        setTrick(newTrick);

        if (newTrick.length === numPlayers) {
            setPhase('TRICK_END');
            setTimeout(() => resolveTrick(newTrick), 1500);
        } else {
            setTurn((playerId + 1) % numPlayers);
        }
    };

    const resolveTrick = (completedTrick) => {
        const effectiveTrump = trump.revealed ? trump.suit : null;
        const winnerId = getTrickWinner(completedTrick, effectiveTrump);
        
        let tensInTrick = [];
        completedTrick.forEach(t => {
            if (t.card.rank === '10') tensInTrick.push(t.card);
        });

        const winningTeam = winnerId % 2 === 0 ? 'team0' : 'team1';
        
        // Update State
        const newTeam0Tens = winningTeam === 'team0' ? [...capturedTens.team0, ...tensInTrick] : capturedTens.team0;
        const newTeam1Tens = winningTeam === 'team1' ? [...capturedTens.team1, ...tensInTrick] : capturedTens.team1;

        setCapturedTens({ team0: newTeam0Tens, team1: newTeam1Tens });
        
        addLog(`Player ${winnerId} wins the trick` + (tensInTrick.length > 0 ? ` and captures ${tensInTrick.length} Mindi(s)!` : '.'));

        setTrick([]);
        
        // --- GAME END CHECK ---
        // Check if ALL 10s are captured.
        const totalTens = (numPlayers === 6 || numPlayers === 8) ? 8 : 4;
        const totalCaptured = newTeam0Tens.length + newTeam1Tens.length;

        if (totalCaptured >= totalTens) {
            // Game Ends Immediately
            endGame({
                team0: newTeam0Tens.length,
                team1: newTeam1Tens.length
            });
        } else {
            setTurn(winnerId);
            setPhase('PLAY');
        }
    };

    const endGame = (finalScores) => {
        let winner = '';
        const majority = (numPlayers === 6 || numPlayers === 8) ? 4 : 2; 

        if (finalScores.team0 > majority) winner = 'TEAM BLUE (YOU)';
        else if (finalScores.team1 > majority) winner = 'TEAM RED';
        else winner = 'DRAW';

        // Short delay to let the last card animation finish
        setTimeout(() => {
            setWinnerData({ winner, scores: finalScores });
            addLog(`--- GAME OVER: ${winner} WINS ---`);
        }, 500);
    };

    // --- Human Interactions ---

    const onHumanCardClick = (card) => {
        if (turn !== 0) return; 
        if (phase !== 'PLAY') return;

        const hand = hands[0];
        let leadSuit = null;
        if (trick.length > 0) {
            leadSuit = trick[0].card.suit;
            const hasSuit = hand.some(c => c.suit === leadSuit);
            if (hasSuit && card.suit !== leadSuit) {
                addLog("You must follow the suit!");
                return; 
            }
        }

        if (trick.length > 0 && leadSuit && card.suit !== leadSuit && !trump.revealed) {
            addLog(`You revealed the Trump: ${SUIT_ICONS[trump.suit]} ${trump.suit}!`);
            setTrump(prev => ({ ...prev, revealed: true }));
        }

        handlePlayCard(0, card);
    };

    // --- Helper: Check if card is valid for highlighting ---
    const isCardPlayable = (card) => {
        if (turn !== 0) return false;
        if (trick.length === 0) return true;
        
        const leadSuit = trick[0].card.suit;
        const hasSuit = hands[0].some(c => c.suit === leadSuit);
        
        if (hasSuit) return card.suit === leadSuit;
        return true; 
    };

    // --- Render Helpers ---
    const getPlayerPosClass = (pId) => {
        if (pId === 0) return 'p-pos-0';
        
        if (numPlayers === 4) {
            if (pId === 1) return 'p4-pos-1';
            if (pId === 2) return 'p4-pos-2';
            if (pId === 3) return 'p4-pos-3';
        }
        if (numPlayers === 6) {
            // Tightened layout
            const positions = [
                '', 'bottom-[180px] left-8', 'top-[35%] left-10', 'top-8 left-1/2 -translate-x-1/2', 'top-[35%] right-10', 'bottom-[180px] right-8'
            ];
            return positions[pId] || '';
        }
        return '';
    };
    
    const get8PlayerStyle = (pId) => {
        if (numPlayers !== 8) return {};
        const angle = ((pId) / 8) * 2 * Math.PI + (Math.PI/2);
        // Reduced radius for "Near each other" effect
        const x = 50 + 32 * Math.cos(angle);
        const y = 45 + 28 * Math.sin(angle);
        return { top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' };
    };

    const getPlayedCardStyle = (pId) => {
        const angleStep = 360 / numPlayers;
        const angle = (90 + (pId * angleStep)) * (Math.PI / 180);
        const r = 10; // Tighter center circle
        const x = 50 + r * Math.cos(angle);
        const y = 50 + r * Math.sin(angle);
        return { top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' };
    };

    const currentTrickWinnerId = trick.length > 0 
        ? getTrickWinner(trick, trump.revealed ? trump.suit : null) 
        : null;

    // --- Views ---

    if (view === 'LOBBY') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white font-sans bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                 <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');`}</style>
                <h1 className="text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-yellow-600 drop-shadow-lg flex items-center gap-4 tracking-tighter">
                    <Crown className="w-16 h-16 text-yellow-500 fill-yellow-500" />
                    MINDI COAT
                </h1>
                <div className="bg-slate-800/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-slate-600 text-center max-w-md w-full">
                    <p className="mb-8 text-slate-200 text-lg font-medium flex items-center justify-center gap-2">
                        <Users size={24} className="text-blue-400" />
                        Select Table Size
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {[4, 6, 8].map(n => (
                            <button 
                                key={n}
                                onClick={() => startGame(n)}
                                className="py-4 bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95 border-b-4 border-blue-900"
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                    <div className="mt-10 pt-6 border-t border-slate-700 text-sm text-slate-400 space-y-3">
                        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                            <span className="flex items-center gap-2"><HelpCircle size={16}/> Trump</span>
                            <span className="text-yellow-400 font-bold">Random & Hidden</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                            <span className="flex items-center gap-2"><Trophy size={16}/> Hand Size</span>
                            <span className="text-green-400 font-bold">9 Cards</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-[#0a3a2a] overflow-hidden font-sans text-white selection:bg-yellow-500/30">
            {/* Rukh/Felt Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>

            {/* Winner Modal & Fireworks */}
            {winnerData && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                    <Fireworks />
                    <div className="bg-slate-900/90 p-10 rounded-3xl border-4 border-yellow-500 shadow-2xl text-center max-w-lg w-full relative z-[101] transform scale-110 animate-in zoom-in duration-300">
                        <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2">
                            {winnerData.winner} WINS!
                        </h2>
                        <div className="flex justify-center gap-8 my-8 text-xl font-bold">
                            <div className="text-blue-400 flex flex-col">
                                <span>Blue Team</span>
                                <span className="text-3xl text-white">{winnerData.scores.team0} <span className="text-sm text-slate-400">Tens</span></span>
                            </div>
                            <div className="text-red-400 flex flex-col">
                                <span>Red Team</span>
                                <span className="text-3xl text-white">{winnerData.scores.team1} <span className="text-sm text-slate-400">Tens</span></span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setView('LOBBY')}
                            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full shadow-lg transition hover:scale-105"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                .card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                
                .p-pos-0 { bottom: 30px; left: 50%; transform: translateX(-50%); } 
                .p4-pos-1 { top: 50%; left: 40px; transform: translateY(-50%); }
                .p4-pos-2 { top: 60px; left: 50%; transform: translateX(-50%); }
                .p4-pos-3 { top: 50%; right: 40px; transform: translateY(-50%); }
                
                .p6-pos-1 { bottom: 180px; left: 60px; }
                .p6-pos-2 { top: 35%; left: 40px; transform: translateY(-50%); }
                .p6-pos-3 { top: 40px; left: 50%; transform: translateX(-50%); }
                .p6-pos-4 { top: 35%; right: 40px; transform: translateY(-50%); }
                .p6-pos-5 { bottom: 180px; right: 60px; }

                @keyframes deal {
                    from { opacity: 0; transform: scale(0.5) translateY(-100px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .played-card { animation: deal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                
                .hand-scroll::-webkit-scrollbar { height: 6px; }
                .hand-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
                .hand-scroll::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 10px; }
            `}</style>

            {/* Log Panel */}
            <LogPanel messages={messages} isOpen={isLogOpen} setIsOpen={setIsLogOpen} />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-40 pointer-events-none">
                <div className="bg-slate-900/90 px-4 py-3 rounded-xl backdrop-blur-sm border-2 border-slate-700 shadow-xl flex gap-6 items-start">
                    {/* Team Blue Score */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-blue-400 tracking-wider mb-1">TEAM BLUE</span>
                        <div className="flex gap-1 bg-blue-900/50 p-1 rounded border border-blue-800 min-h-[32px] min-w-[60px] items-center justify-center">
                            {capturedTens.team0.length > 0 ? capturedTens.team0.map((c, i) => (
                                <span key={i} className={`text-xs font-bold ${SUIT_COLORS[c.suit]}`}>{SUIT_ICONS[c.suit]}</span>
                            )) : <span className="text-blue-600/50 text-xs">-</span>}
                        </div>
                        <span className="text-lg font-black text-blue-400">{capturedTens.team0.length}</span>
                    </div>
                    
                    <div className="w-px bg-slate-700 h-16"></div>
                    
                    {/* Team Red Score */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-red-400 tracking-wider mb-1">TEAM RED</span>
                        <div className="flex gap-1 bg-red-900/50 p-1 rounded border border-red-800 min-h-[32px] min-w-[60px] items-center justify-center">
                            {capturedTens.team1.length > 0 ? capturedTens.team1.map((c, i) => (
                                <span key={i} className={`text-xs font-bold ${SUIT_COLORS[c.suit]}`}>{SUIT_ICONS[c.suit]}</span>
                            )) : <span className="text-red-600/50 text-xs">-</span>}
                        </div>
                        <span className="text-lg font-black text-red-400">{capturedTens.team1.length}</span>
                    </div>
                </div>
                
                {/* Trump Indicator */}
                <div className="bg-slate-900/90 p-4 rounded-xl backdrop-blur-sm border-2 border-slate-700 shadow-xl flex flex-col items-center min-w-[100px] transition-all duration-500">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        {trump.revealed ? "Trump Open" : "Trump Hidden"}
                    </span>
                    
                    {trump.revealed ? (
                        <div className={`text-4xl font-black scale-110 transition-transform ${SUIT_COLORS[trump.suit]} bg-white w-12 h-12 rounded flex items-center justify-center shadow-sm`}>
                            {SUIT_ICONS[trump.suit]}
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-indigo-600 rounded-lg border-2 border-indigo-400 flex items-center justify-center shadow-inner animate-pulse">
                            <HelpCircle className="text-white/50" size={24}/>
                        </div>
                    )}
                </div>
            </div>

            {/* Opponents */}
            {hands.map((hand, idx) => {
                if (idx === 0) return null;
                
                const isTurn = turn === idx;
                const isWinning = currentTrickWinnerId === idx;
                const posClass = getPlayerPosClass(idx);
                const style8 = get8PlayerStyle(idx);
                
                const isTeamBlue = idx % 2 === 0;
                const teamColorClass = isTeamBlue ? "border-blue-500 shadow-blue-500/30" : "border-red-500 shadow-red-500/30";
                const teamBgClass = isTeamBlue ? "bg-blue-900" : "bg-red-900";

                return (
                    <div 
                        key={idx}
                        className={`absolute ${numPlayers !== 8 ? posClass : ''} flex flex-col items-center transition-all duration-500 z-10`}
                        style={style8}
                    >
                        {/* Winning Badge */}
                        {isWinning && (
                            <div className="absolute -top-8 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce z-20 flex items-center gap-1">
                                <Star size={10} className="fill-current"/> WINNING
                            </div>
                        )}

                        <div className={`
                            w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center 
                            border-4 shadow-2xl relative bg-slate-800 transition-all duration-300
                            ${isTurn ? 'scale-110 ring-4 ring-yellow-400/50' : ''}
                            ${teamColorClass}
                        `}>
                            <User size={40} className={isTeamBlue ? "text-blue-200" : "text-red-200"}/>
                            <span className={`font-bold text-xs absolute -top-3 ${teamBgClass} text-white px-2 py-0.5 rounded-full border border-slate-700 shadow-sm`}>
                                P{idx}
                            </span>
                            <div className="absolute -bottom-3 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-400 shadow-sm">
                                {hand.length} 
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Center Table (Trick) */}
            <div className="absolute top-[42%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center z-0 pointer-events-none">
                <div className="absolute w-48 h-48 border-4 border-dashed border-white/10 rounded-full"></div>
                
                {trick.map((play, i) => {
                    const isTeamBlue = play.playerId % 2 === 0;
                    const badgeColor = isTeamBlue ? "bg-blue-600" : "bg-red-600";
                    const cardStyle = getPlayedCardStyle(play.playerId);
                    
                    return (
                        <div 
                            key={i} 
                            className="absolute played-card shadow-2xl"
                            style={{ 
                                ...cardStyle,
                                zIndex: 10 + i 
                            }}
                        >
                            <Card card={play.card} size="sm" className="border-slate-200" />
                            <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold ${badgeColor} text-white px-2 py-1 rounded-full whitespace-nowrap shadow-sm backdrop-blur-sm border border-white/20`}>
                                P{play.playerId}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* User Hand (Player 0) */}
            <div className="absolute bottom-0 left-0 w-full pb-6 z-50 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20">
                {/* Added pointer-events-none to prevent text from blocking clicks on cards that might overlap */}
                <div className="text-center mb-4 font-bold text-lg flex items-center justify-center gap-2 drop-shadow-md pointer-events-none relative z-0">
                    {currentTrickWinnerId === 0 && (
                        <span className="text-green-400 flex items-center gap-1 animate-pulse mr-4">
                            <Star size={16} className="fill-current"/> YOU ARE WINNING
                        </span>
                    )}
                    
                    {turn === 0 ? (
                        <span className="text-yellow-400 animate-pulse flex items-center gap-2">
                            <Play size={16} className="fill-current"/> YOUR TURN
                        </span>
                    ) : (
                        <span className="text-slate-300 text-sm">Waiting for Player {turn}...</span>
                    )}
                </div>

                <div className={`
                    flex justify-center items-end h-60 hand-scroll overflow-x-auto overflow-y-visible pb-8 px-4 mx-auto max-w-full transition-all duration-300
                `}>
                   {hands[0] && hands[0].map((card, i) => {
                       const playable = isCardPlayable(card);
                       
                       return (
                           <div 
                                key={card.id} 
                                className={`transform transition-all duration-300 -ml-8 md:-ml-12 first:ml-0 hover:z-50
                                    ${playable ? 'hover:-translate-y-6' : 'opacity-50 scale-95 grayscale filter blur-[0.5px] pointer-events-none'}
                                `}
                                // Increased base z-index to ensure cards are always above the text container background if any
                                style={{ zIndex: 10 + i }}
                           >
                               <Card 
                                    card={card} 
                                    disabled={!playable}
                                    onClick={(c) => onHumanCardClick(c)}
                                    className="shadow-2xl ring-1 ring-black/20"
                               />
                           </div>
                       )
                   })}
                </div>
            </div>
        </div>
    );
}
