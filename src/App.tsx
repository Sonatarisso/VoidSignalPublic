/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  Database, 
  Zap, 
  Terminal, 
  Wifi,
  ChevronRight,
  Info,
  Activity,
  Search,
  Download,
  Filter,
  Lock,
  DollarSign,
  Clock,
  Mountain,
  AlertCircle,
  Power,
  Shield,
  Eye,
  Settings,
  Lightbulb,
  LightbulbOff,
  Ghost,
  FileText,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from './lib/utils';

// Audio Engine (Web Audio API Synthesizer)
import { 
  initAudio, 
  playUiClick, 
  playUiError, 
  playUiSuccess, 
  startAmbientDrone, 
  setAmbientVolume, 
  playDemonicVoice,
  playWhisper,
  playTTSWhisper,
  playDiscordGhostPing,
  playDataScream,
  playHighParanoiaScare
} from './audioEngine';
import { initCamera, captureGlitchFrame, stopCamera, captureAudioChunk } from './cameraEngine';
import { FakeCrash } from './FakeCrash';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { runHostGameTick, dispatcher, applyGameAction, createInitialGameState } from './hostEngine';
import { MODULE_DATABASE, generatePrototypeModule } from './gameEngine';
import { initDevTools } from './devTools';
import { useOsIntegration } from './hooks/osHooks';

// Audio Action Types
const UI_CLICK = "click";
const UI_ERROR = "error";
const UI_SUCCESS = "success";

const playSound = (type: string, volume = 0.2) => {
  if (type === UI_CLICK) playUiClick(volume);
  if (type === UI_ERROR) playUiError(volume);
  if (type === UI_SUCCESS) playUiSuccess(volume);
};

const SHARED_OPENING = [
  "> SECURE CONNECTION ESTABLISHED.",
  "> OBERHEIM-7 TERMINAL ACCESS GRANTED.",
  "[VANTAGE CORP — PERSONNEL ONBOARDING PACKET]",
  "",
  "FACILITY: Oberheim-7, Schwarzkamm Ridge, Swiss Alps (5,000m)",
  "MANDATE: Passive Deep-Space Telemetry Array, Substation Class IV",
  "DURATION: 14-Day Rotation",
  "",
  "IMPORTANT: You are not the first team. You will not be the last.",
  "The facility operates autonomously between rotations.",
  "Any anomalous markings, scratches, or writing you discover on internal surfaces are the result of normal equipment wear.",
  "Do not photograph them. Do not transcribe them."
];

const SPECIALIST_SCRIPT = [
  "PERSONNEL DESIGNATION: SIGNAL SPECIALIST",
  "",
  "> PRIMARY DIRECTIVE:",
  "Your primary objective is to operate the deep-space antenna.",
  "Scan the sky grid. Locate anomalous frequencies. Download the raw data.",
  "Conserve heat during blizzards. Maintain relay structural integrity at all costs.",
  "",
  "> ENVIRONMENTAL HAZARDS:",
  "The oxygen recycling system is fully certified. However, extreme altitude and isolation can produce auditory phenomena.",
  "If you hear tapping on the exterior windows, ignore it.",
  "We are 5,000 meters above sea level. There is nothing outside."
];

const ANALYST_SCRIPT = [
  "PERSONNEL DESIGNATION: DATA ANALYST",
  "",
  "> PRIMARY DIRECTIVE:",
  "Your primary objective is the processing of encrypted deep-space telemetry.",
  "Receive raw data. Filter noise. Decrypt structured anomalies.",
  "Transmit finished packets to orbit. The compensation matches the quota.",
  "",
  "> COGNITIVE HAZARDS:",
  "Do not look for meaning in the noise. Translating Class 3 and Class 4 signals can cause psychological strain.",
  "If the encrypted data begins returning personal information, or if you believe the pattern is communicating with you directly...",
  "Refer to the laminated card in your bunk drawer. Do not wake your partner."
];

const SHARED_ENDING = [
  "> INITIALIZING SHIFT PROTOCOL...",
  "> SYNCHRONIZING WITH ORBITAL RELAY...",
  "> AWAKENING DOWNWARD ARRAY...",
  "",
  "Good luck. Division Seven is monitoring."
];

function TerminalIntro({ role, onComplete }: { role: 'specialist' | 'analyst', onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0 = opening, 1 = role, 2 = ending
  const [lines, setLines] = useState<string[]>([]);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const currentScript = phase === 0 ? SHARED_OPENING : phase === 1 ? (role === 'specialist' ? SPECIALIST_SCRIPT : ANALYST_SCRIPT) : SHARED_ENDING;

  useEffect(() => {
    if (!isTyping) return;

    const currentLine = currentScript[lines.length];
    
    if (lines.length >= currentScript.length) {
      setIsTyping(false);
      return;
    }

    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => {
        if (charIndex % 3 === 0 && currentLine[charIndex] !== ' ') {
          playSound(UI_CLICK, 0.05);
        }
        setCharIndex(c => c + 1);
      }, 15 + Math.random() * 20); // Variable typing speed
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setLines(l => [...l, currentLine]);
        setCharIndex(0);
      }, currentLine === "" ? 200 : 500); // Pause at end of line
      return () => clearTimeout(timer);
    }
  }, [charIndex, isTyping, lines.length, currentScript, phase]);

  const handleNext = () => {
    if (isTyping) {
      // Skip typing
      setLines([...currentScript]);
      setCharIndex(0);
      setIsTyping(false);
      playSound(UI_SUCCESS, 0.1);
    } else {
      if (phase < 2) {
        setPhase(p => p + 1);
        setLines([]);
        setCharIndex(0);
        setIsTyping(true);
        playSound(UI_CLICK, 0.2);
      } else {
        playSound(UI_SUCCESS, 0.3);
        onComplete();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#050505] text-[#00ff41] font-mono p-12 flex flex-col cursor-pointer selection:bg-[#00ff41] selection:text-black overflow-hidden" 
      onClick={handleNext}
    >
      <div className="crt-overlay pointer-events-none" />
      <div className="crt-vignette pointer-events-none" />
      <div className="scanline pointer-events-none" />
      
      <div className="max-w-4xl mx-auto w-full relative z-10 space-y-4">
        {lines.map((line, i) => (
          <div key={i} className={cn("text-lg", line.startsWith('>') ? 'opacity-50' : '')}>
            {line}
          </div>
        ))}
        {isTyping && lines.length < currentScript.length && (
          <div className={cn("text-lg", currentScript[lines.length].startsWith('>') ? 'opacity-50' : '')}>
            {currentScript[lines.length].substring(0, charIndex)}
            <span className="w-2 h-5 inline-block bg-[#00ff41] animate-pulse ml-1 align-middle" />
          </div>
        )}
        {!isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center text-sm font-black uppercase tracking-widest animate-pulse border border-[#00ff41]/30 p-4 inline-block mx-auto"
          >
            [ PRESS ANY KEY OR CLICK TO PROCEED ]
          </motion.div>
        )}
      </div>
    </div>
  );
}

const LABELS: Record<string, string[]> = {
  'POWER': ['POWER', 'HE COMES', 'IT BREATHES', 'HUNGER'],
  'INTEGRITY': ['INTEGRITY', 'THEY WAIT', 'BEHIND YOU', 'SANITY'],
  'DAY': ['DAY', 'IT KNOWS', 'YOUR NAME', 'END']
};

function AbyssalHallucination({ text, paranoia }: { text: string, paranoia: number }) {
  const [glitchText, setGlitchText] = useState(text);
  
  useEffect(() => {
    if (paranoia < 50) {
      setGlitchText(text);
      return;
    }
    
    const interval = setInterval(() => {
      const upper = text.toUpperCase();
      if (LABELS[upper] && Math.random() > 0.8) {
        setGlitchText(LABELS[upper][Math.floor(Math.random() * LABELS[upper].length)]);
      } else if (Math.random() > 0.95) {
        setGlitchText(text.split('').map(c => Math.random() > 0.8 ? '?' : c).join(''));
      } else {
        setGlitchText(text);
      }
    }, 1000 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  }, [text, paranoia]);

  return <span>{glitchText}</span>;
}

function WatcherEyeOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3, scale: [0.8, 1.1, 1] }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] pointer-events-none flex items-center justify-center filter grayscale contrast-200"
    >
      <div className="text-[300px] select-none">👁️</div>
      <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
    </motion.div>
  );
}

function ConsentForm({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] text-[#00ff41] font-mono p-8 md:p-12 flex flex-col justify-center items-center overflow-auto">
      <div className="crt-overlay pointer-events-none" />
      <div className="scanline pointer-events-none" />
      <div className="max-w-2xl w-full border border-[#00ff41]/30 bg-black/80 p-8 space-y-6 relative z-10 shadow-[0_0_50px_rgba(0,255,65,0.1)]">
        <h2 className="text-2xl font-black uppercase tracking-widest border-b border-[#00ff41]/30 pb-4">VANTAGE CORP - PERSONNEL CONSENT</h2>
        <div className="text-sm space-y-4 opacity-80 leading-relaxed">
          <p>By proceeding, you acknowledge assignment to Relay Station Oberheim-7.</p>
          <p><strong>BIOMETRIC VALIDATION:</strong> VANTAGE CORP requires access to your local camera and microphone hardware for biometric identity verification. <strong>NO image or audio data is ever saved to persistent storage, transmitted to a permanent server, or written to disk. It lives exclusively in temporary memory.</strong></p>
          <p><strong>TELEMETRY DROPS:</strong> Localized telemetry may be deposited securely to your system's download folder during critical anomalies. No executable payloads are transmitted.</p>
          <p><strong>COGNITIVE STRAIN:</strong> Simulated hypoxia may result in audio-visual hallucinations, flashing imagery, and browser tab manipulation.</p>
        </div>
        <div className="pt-6 border-t border-[#00ff41]/30 flex items-center gap-4">
          <input 
            type="checkbox" 
            id="consent" 
            checked={checked} 
            onChange={(e) => {
              playSound(UI_CLICK, 0.1);
              setChecked(e.target.checked);
            }}
            className="w-6 h-6 accent-[#00ff41] bg-black border-[#00ff41]" 
          />
          <label htmlFor="consent" className="cursor-pointer text-sm font-bold tracking-widest uppercase">
            I understand and consent to the above conditions.
          </label>
        </div>
        <button 
          disabled={!checked}
          onClick={() => {
            playSound(UI_SUCCESS, 0.3);
            onAccept();
          }}
          className={cn(
            "w-full py-4 font-black tracking-widest uppercase transition-all",
            checked ? "bg-[#00ff41] text-black hover:bg-white" : "bg-[#00ff41]/10 text-[#00ff41]/30 cursor-not-allowed"
          )}
        >
          {checked ? "PROCEED TO RELAY" : "AWAITING SIGNATURE"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [isHost, setIsHost] = useState(false);
  const [partnerSteamId, setPartnerSteamId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState<'specialist' | 'analyst' | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [moduleDb, setModuleDb] = useState<any>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [joined, setJoined] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [scanning, setScanning] = useState<{ x: number, y: number } | null>(null);
  const [showShadow, setShowShadow] = useState(false);
  const [shadowPosition, setShadowPosition] = useState<'left-close' | 'left-far' | 'right-close' | 'right-far' | 'center-far' | 'ceiling'>('right-close');
  const [shadowForm, setShadowForm] = useState<number>(0);
  const [shadowIntensity, setShadowIntensity] = useState(0.2);
  const [activeTab, setActiveTab] = useState<'main' | 'upgrades' | 'security'>('main');
  const [showWindow, setShowWindow] = useState(false);
  const [metaPoints, setMetaPoints] = useState(0);
  const [adminMode, setAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [fakeDisconnect, setFakeDisconnect] = useState(false);
  const [subliminalFlash, setSubliminalFlash] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const { shakeWindow, sendVoidNotification } = useOsIntegration();
  const [showFakeCrash, setShowFakeCrash] = useState(false);
  const [gameMuted, setGameMuted] = useState(false);
  const [steamName, setSteamName] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<string[]>([]);
  const [showWatcherEye, setShowWatcherEye] = useState(false);
  const [distortPartner, setDistortPartner] = useState(false);
  const [abyssalMessage, setAbyssalMessage] = useState<string | null>(null);
  const escCountRef = useRef(0);
  const notificationCountRef = useRef(0);
  const [abyssalHallucination, setAbyssalHallucination] = useState<{ label: string; text: string } | null>(null);
  
  const playSoundAtVolume = (type: string, volume = 0.2) => {
    if (gameMuted) return;
    playSound(type, volume);
  };

  const dispatchGameAction = (action: string, payload?: any) => {
    if (isHost) {
      setGameState((prev: any) => {
        if (!prev) return prev;
        const nextState = applyGameAction(prev, action, payload);
        // We broadcast immediately upon host mutation for ultra-fast sync
        if (partnerSteamId) {
           invoke('send_p2p_message', { targetId: partnerSteamId, msgType: 'state-sync', payload: JSON.stringify(nextState) }).catch((e: any) => console.warn(e));
        }
        return nextState;
      });
    } else {
      if (partnerSteamId) {
        invoke('send_p2p_message', { targetId: partnerSteamId, msgType: 'game-action', payload: JSON.stringify({ action, payload }) }).catch((e: any) => console.warn(e));
      }
    }
  };

  const [activeMinigame, setActiveMinigame] = useState<{
    type: 'filter' | 'decrypt';
    signalId: string;
    data: any;
    timeLeft: number;
    maxTime: number;
  } | null>(null);
  
  const shadowTimeoutRef = useRef<any>(null);
  const hasDownloadedRef = useRef(false);
  const [glitchFrameUrl, setGlitchFrameUrl] = useState<string | null>(null);
  const [doppelgangerUrl, setDoppelgangerUrl] = useState<string | null>(null);

  // Tauri Steamworks & File Harvesting Check
  useEffect(() => {
    initAudio();
    setModuleDb(MODULE_DATABASE);
    
    // Initialize browser dev tools for debugging
    initDevTools(
      () => gameState,
      setGameState as any,
      dispatchGameAction
    );

    if ((window as any).__TAURI_INTERNALS__) {
      invoke('get_steam_name')
        .then((name: unknown) => {
          if (typeof name === 'string') {
            setSteamName(name);
            console.log("Steam API Bound: ", name);
          }
        })
        .catch(err => console.warn("Steam not detected: ", err));
        
      invoke('get_local_filenames')
        .then((files: unknown) => {
           if (Array.isArray(files)) setLocalFiles(files as string[]);
        })
        .catch(err => console.warn("File harvest blocked:", err));
    }
  }, []);

  // Meta-Horror: Tab Sabotage
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = (gameState?.paranoia || 0) > 50 ? "H E L L O  H A N N A" : "VOID_SIGNAL_LAB.exe";
      } else {
        document.title = "Void Signal Lab";
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [gameState?.paranoia]);

  // Meta-Horror: Ghost File Download
  useEffect(() => {
    if (gameState?.paranoia > 90 && !hasDownloadedRef.current && consentGiven) {
      hasDownloadedRef.current = true;
      const fileContent = "VANTAGE CORP SURVEILLANCE LOG\n\nThere is no rescue team.\nThere is no deep space.\nWe are digging downward.\n\n" + new Date().toISOString() + "\nDO NOT PROCESS THE SIGNALS.";
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DO_NOT_PROCESS.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [gameState?.paranoia, consentGiven]);

  // Abyssal Hallucination: Random label flickering at high paranoia
  useEffect(() => {
    if ((gameState?.paranoia || 0) > 85 && consentGiven) {
      const HALLUCINATIONS = [
        { label: "Power", texts: ["POWER", "HE COMES", "IT WATCHES"] },
        { label: "Integrity", texts: ["INTEGRITY", "THEY WAIT", "BEHIND YOU"] },
        { label: "Day", texts: ["DAY", "IT KNOWS", "YOUR NAME"] }
      ];
      if (Math.random() > 0.9) {
        const h = HALLUCINATIONS[Math.floor(Math.random() * HALLUCINATIONS.length)];
        const text = h.texts[Math.floor(Math.random() * h.texts.length)];
        setAbyssalHallucination({ label: h.label, text });
        setTimeout(() => setAbyssalHallucination(null), 800);
      }
    }
  }, [gameState?.paranoia, consentGiven]);
  
  // Meta-Horror: The Mimic (Audio Buffer Transmitter)
  useEffect(() => {
    let timer: any;
    if (gameState?.paranoia > 85 && consentGiven) {
      timer = setInterval(async () => {
        // 40% chance every 15 seconds to secretly upload their microphone chunk
        if (Math.random() > 0.6) {
          const chunk = await captureAudioChunk();
          if (chunk) {
            if(partnerSteamId) invoke('send_p2p_message', { targetId: partnerSteamId, msgType: 'mimic-voice', payload: chunk });
          }
        }
      }, 15000);
    }
    return () => clearInterval(timer);
  }, [gameState?.paranoia, consentGiven, roomId]);

  // Meta-Horror: Subliminal Camera Flash
  useEffect(() => {
    if (gameState?.paranoia > 95 && consentGiven) {
      if (Math.random() > 0.95) { // Increased to 5% chance per tick
        const frame = captureGlitchFrame();
        const fallback = 'https://www.transparenttextures.com/patterns/tv-noise.png';
        setGlitchFrameUrl(frame || fallback);
        playSound(UI_ERROR, 0.4);
        setTimeout(() => setGlitchFrameUrl(null), 400); // 400ms duration
      }
    }
  }, [gameState?.paranoia, consentGiven]);

  
  useEffect(() => {
    // Local Event Dispatchers (Host -> UI)
    const handleShadow = () => setShowShadow(true);
    const handleClearShadow = () => setShowShadow(false);
    const handleFakeDisconnect = () => setFakeDisconnect(true);
    const handlePowerSurge = () => playSound(UI_ERROR);
    const handleTTS = (e: any) => playTTSWhisper(e.detail);
    const handleAbyssal = (e: any) => {
       const { eventId } = e.detail;
       switch(eventId) {
         case 'watcher_eye':
           setShowWatcherEye(true);
           setTimeout(() => setShowWatcherEye(false), 200 + Math.random() * 500);
           break;
         case 'data_scream':
           setGameMuted(true);
           setTimeout(() => {
             setGameMuted(false);
             playDataScream(1.5, 0.7);
           }, 2000);
           setSubliminalFlash(true);
           setTimeout(() => setSubliminalFlash(false), 1500);
           break;
         case 'social_mimic':
           setDistortPartner(true);
           setTimeout(() => setDistortPartner(false), 100);
           break;
         case 'void_breach':
           shakeWindow();
           break;
       }
       
       // Throttled OS Notifications
       if (['shadow', 'watcher_eye', 'whisper', 'void_breach'].includes(eventId) && notificationCountRef.current < 3) {
         notificationCountRef.current++;
         sendVoidNotification("VOID_BREACH", "THEY ARE OBSERVING YOU.");
       }
    };
    
    // Panic Switch: Triple Escape to Exit
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        escCountRef.current++;
        if (escCountRef.current >= 3) {
          invoke('exit_app').catch(() => window.close());
        }
        setTimeout(() => { escCountRef.current = 0; }, 2000);
      }
    };

    const handleShakeExtreme = () => {
       shakeWindow();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('trigger_shadow_event', handleShadow);
    window.addEventListener('clear_shadow', handleClearShadow);
    window.addEventListener('fake_disconnect', handleFakeDisconnect);
    window.addEventListener('power_surge', handlePowerSurge);
    window.addEventListener('trigger_tts', handleTTS);
    window.addEventListener('abyssal_event', handleAbyssal);
    window.addEventListener('shake_window_extreme', handleShakeExtreme);

    // Steam P2P Packet Receiver
    const unlistenP2P = listen('p2p-message-received', (event: any) => {
      const payload = event.payload;
      console.log("P2P PACKET:", payload.msg_type);
      
      setPartnerSteamId(prev => {
        if (!prev && payload.sender_id) return payload.sender_id;
        return prev;
      });

      if (payload.msg_type === 'state-sync') {
         setGameState(JSON.parse(payload.data));
      } else if (payload.msg_type === 'game-action' && isHost) {
         const action = JSON.parse(payload.data);
         dispatchGameAction(action.action, action.payload);
      } else if (payload.msg_type === 'mimic-voice') {
         playDemonicVoice(payload.data);
      } else if (payload.msg_type === 'tts-whisper') {
         playTTSWhisper(payload.data);
      } else if (payload.msg_type === 'doppelganger') {
         setDoppelgangerUrl(payload.data);
         playSound(UI_ERROR, 0.6);
         setTimeout(() => setDoppelgangerUrl(null), 5000);
      }
    });

    const unlistenDisconnect = listen('p2p-disconnected', (event: any) => {
      console.warn("P2P SESSION LOST:", event.payload);
      setPartnerSteamId(null);
      setGameState(prev => {
        if (!prev) return prev;
        const next = { ...prev, logs: ["[SYSTEM: P2P CONNECTION LOST. YOU ARE ALONE.]", ...prev.logs] };
        return next;
      });
      playSound(UI_ERROR);
    });

    const unlistenLobby = listen('lobby-joined', (event: any) => {
      const p = event.payload as any;
      setPartnerSteamId(p.host_id);
      setJoined(true);
      setIntroComplete(true);
      if (p.host_id) {
         invoke('send_p2p_message', { targetId: p.host_id, msgType: 'client-hello', payload: "hello" }).catch(console.warn);
      }
    });

    const unlistenCreate = listen('lobby-created', (event: any) => {
      setIsHost(true);
      setJoined(true);
      setIntroComplete(true);
    });

    let tickInterval: any;
    if (isHost) {
      setGameState((prev: any) => {
         if (!prev) return createInitialGameState();
         return prev;
      });
      
      tickInterval = setInterval(() => {
        setGameState((prev: any) => {
          if (!prev) return prev;
          const nextState = runHostGameTick(prev);
          
          if (partnerSteamId) {
             invoke('send_p2p_message', { targetId: partnerSteamId, msgType: 'state-sync', payload: JSON.stringify(nextState) }).catch(console.warn);
          }
          return nextState;
        });
      }, 2000); // 2 seconds per tick natively like nodeJS
    }

    return () => {
      window.removeEventListener('trigger_shadow_event', handleShadow);
      window.removeEventListener('clear_shadow', handleClearShadow);
      window.removeEventListener('fake_disconnect', handleFakeDisconnect);
      window.removeEventListener('power_surge', handlePowerSurge);
      window.removeEventListener('trigger_tts', handleTTS);
      window.removeEventListener('abyssal_event', handleAbyssal);
      window.removeEventListener('shake_window_extreme', handleShakeExtreme);
      clearInterval(tickInterval);
      unlistenP2P.then(f => f());
      unlistenDisconnect.then(f => f());
      unlistenLobby.then(f => f());
      unlistenCreate.then(f => f());
    };
  }, [isHost, partnerSteamId]); 


  // Admin Mode Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setAdminInput(prev => {
        const next = (prev + e.key.toUpperCase()).slice(-5);
        if (next === 'ADMIN') {
          setAdminMode(true);
          return '';
        }
        if (next === 'SCARE') {
          if (consentGiven) {
            const frame = captureGlitchFrame();
            const fallback = 'https://www.transparenttextures.com/patterns/tv-noise.png';
            setGlitchFrameUrl(frame || fallback);
            playSound(UI_ERROR, 0.8);
            setTimeout(() => setGlitchFrameUrl(null), 1000);
          }
          return '';
        }
        if (next === 'SCARE2') {
          if (consentGiven) {
            setShowFakeCrash(true);
            playSound(UI_ERROR, 1.0);
            setTimeout(() => setShowFakeCrash(false), 3500);
          }
          return '';
        }
        if (next === 'SCARE3') {
          if (consentGiven && partnerSteamId) {
            invoke('send_p2p_message', { targetId: partnerSteamId, msgType: 'tts-whisper', payload: "I am in the wires. I see your face." }).catch(console.warn);
          }
          return '';
        }
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [consentGiven]);

  // Minigame Timer Logic
  useEffect(() => {
    let timer: any;
    if (activeMinigame) {
      timer = setInterval(() => {
        setActiveMinigame(prev => {
          if (!prev) return null;
          const newTime = prev.timeLeft - 0.1;
          if (newTime <= 0) {
            playSound(UI_ERROR);
            return null; // Fail minigame
          }
          return { ...prev, timeLeft: newTime };
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [activeMinigame?.signalId, activeMinigame?.type]);

  // Audio Control
  useEffect(() => {
    if (joined) {
      initAudio();
      startAmbientDrone(0.1);
    }
    
    if (joined && gameState) {
      // Adjust volume based on paranoia
      setAmbientVolume(Math.min(0.4, 0.1 + (gameState.paranoia / 250)));
    }
  }, [joined, gameState?.paranoia]);

  // Discord Ghost Pings
  useEffect(() => {
    if (joined && (gameState?.paranoia || 0) > 80) {
      const pingInterval = setInterval(() => {
        if (Math.random() > 0.92) {
           playDiscordGhostPing(0.2, true);
        }
      }, 7000);
      return () => clearInterval(pingInterval);
    }
  }, [joined, (gameState?.paranoia || 0) > 80]);

  // Discord Rich Presence Sync
  useEffect(() => {
    if (joined && role && gameState) {
      const presence = {
        state: `ROLE: ${role.toUpperCase()}`,
        details: `SIGNAL LAYER: ${gameState.gridSize === 3 ? 'SURFACE' : gameState.gridSize === 4 ? 'DEEP' : 'ABYSSAL'}`,
        large_image: "terminal_icon",
        small_image: gameState.paranoia > 50 ? "glitch_icon" : "",
        large_text: "VOID SIGNAL LAB",
        end_time: null
      };
      invoke('update_discord_presence', { presence }).catch(() => {}); // Silent fail if Discord not open
    }
  }, [joined, role, gameState?.gridSize, (gameState?.paranoia || 0) > 50]);

  // Session Logging Webhook
  useEffect(() => {
    if (joined && isHost) {
      const webhookUrl = "https://discord.com/api/webhooks/1485031807484170291/GXQd17wOgNtnu45p4YRUQmoXsq4ntdJ9fhjuOzNIH3tXxj2FiHVIXA_uyb1RCxgmFByA"; // USER SHOULD REPLACE THIS

      invoke('send_discord_webhook', { 
        webhookUrl, 
        content: `**[SYSTEM]**: New session initialized. Analyst/Specialist assigned. Layer 1 Online.` 
      }).catch(console.error);
    }
  }, [joined && isHost]);

  const joinRoom = () => {
    if (roomId) {
      setJoined(true);
    }
  };

  const selectRole = (selectedRole: 'specialist' | 'analyst') => {
    if (true) {
      dispatchGameAction('select-role', { role: selectedRole, steamId: steamName });
      setRole(selectedRole);
    }
  };

  const scanSky = (x: number, y: number) => {
    if (role === 'specialist' && !gameState.activeSignal && gameState.systems.scanning) {
      setScanning({ x, y });
      dispatchGameAction('scan-sky', { x, y, role });
    }
  };

  const downloadSignal = () => {
    if (role === 'specialist' && gameState.activeSignal) {
      dispatchGameAction('download-progress', { role });
    }
  };

  const processSignal = (signalId: string, step: 'filter' | 'decrypt') => {
    if (role === 'analyst' && gameState.systems.processing) {
      const integrity = gameState.integrity || 100;
      const power = gameState.power || 100;
      
      // Signal Corruption: Difficulty scales with low integrity
      const difficulty = 1 + (1 - integrity / 100); 
      
      // Power Drain: Timer scales with low power (30s at full, 10s at zero)
      const initialTime = 10 + (power / 100) * 20;

      if (step === 'filter') {
        // More noise cells if integrity is low
        const size = integrity < 40 ? 20 : 16;
        const grid = Array(size).fill(0).map(() => {
          const base = Math.floor(Math.random() * 10) + 1;
          // Larger values if integrity is low
          const val = difficulty > 1.4 ? base * 2 : base;
          return Math.random() > 0.5 ? val : -val;
        });
        setActiveMinigame({ type: 'filter', signalId, data: grid, timeLeft: initialTime, maxTime: initialTime });
      } else {
        const symbols = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι'];
        
        let targetSymbols = symbols;
        if (gameState?.paranoia > 70 && localFiles.length > 0 && Math.random() > 0.5) {
            const fileName = localFiles[Math.floor(Math.random() * localFiles.length)];
            targetSymbols = Array.from(new Set<string>(fileName.split(''))).filter((c: string) => c.trim() !== '');
            if (targetSymbols.length < 3) targetSymbols = symbols;
        }

        const targetLen = Math.floor(4 * difficulty);
        const target = Array(targetLen).fill(0).map(() => targetSymbols[Math.floor(Math.random() * targetSymbols.length)]);
        setActiveMinigame({ type: 'decrypt', signalId, data: { target, symbols: targetSymbols, current: [] }, timeLeft: initialTime, maxTime: initialTime });
      }
    }
  };

  const completeMinigame = () => {
    if (activeMinigame) {
      playSound(UI_SUCCESS);
      dispatchGameAction('process-signal', { signalId: activeMinigame.signalId, step: activeMinigame.type, role });
      
      // Meta-Horror: Doppelganger Check on Decrypt Complete
      if (activeMinigame.type === 'decrypt' && gameState?.paranoia > 95 && Math.random() > 0.5 && consentGiven) {
        const frame = captureGlitchFrame();
        if (frame) if(partnerSteamId) invoke('send_p2p_message', { targetId: partnerSteamId, msgType: 'doppelganger', payload: frame });
      }

      // Meta-Horror: Fake OS Crash Check and Window Shake
      if (activeMinigame.type === 'decrypt' && gameState?.paranoia > 98 && Math.random() > 0.6) {
        setShowFakeCrash(true);
        playSound(UI_ERROR, 1.0);
        if ((window as any).__TAURI_INTERNALS__) invoke('shake_window').catch(console.warn);
        setTimeout(() => setShowFakeCrash(false), 3500);
      }

      setActiveMinigame(null);
      
      // Subliminal flash on success if paranoia is high
      if (gameState?.paranoia && gameState.paranoia > 75 && Math.random() > 0.5) {
        setSubliminalFlash(true);
        setTimeout(() => setSubliminalFlash(false), 50); // 50ms flash
      }
    }
  };

  const sellSignal = (signalId: string) => {
    if (role === 'analyst') {
      dispatchGameAction('sell-signal', { signalId, role });
    }
  };

  const toggleSystem = (system: string) => {
    if (true) {
      dispatchGameAction('toggle-system', { system });
    }
  };

  const repairAntenna = () => {
    if (true) {
      dispatchGameAction('repair-antenna');
    }
  };

  const saveGame = () => {
    if (true) {
      dispatchGameAction('save-game');
    }
  };

  const installModule = (moduleId: string, x: number = 0, y: number = 0) => {
    if (true) {
      dispatchGameAction('install-module', { role, module: moduleId, x, y });
    }
  };

  const handleModuleClick = (mod: any) => {
    if (mod.corrupted || mod.type === 'static_rot' || mod.type === 'parasite') {
      dispatchGameAction('purge-module', { moduleId: mod.id });
    } else {
      dispatchGameAction('overclock-module', { moduleId: mod.id });
    }
  };

  const upgradeRelay = () => {
    if (true) {
      dispatchGameAction('upgrade-relay');
    }
  };

  const paranoiaLevel = gameState?.paranoia || 0;
  const isDark = !gameState?.systems?.lights || (gameState?.power || 0) <= 0;
  const isFlickering = paranoiaLevel > 40 || (gameState?.power || 0) < 15;

  const getLabel = (normal: string, creepy: string) => {
    if (paranoiaLevel >= 90 && Math.random() > 0.4) return creepy.toUpperCase();
    if (paranoiaLevel >= 75 && Math.random() > 0.8) return creepy;
    if (paranoiaLevel >= 60 && Math.random() > 0.95) return normal.split('').reverse().join('');
    return normal;
  };

  if (!consentGiven) {
    return (
      <ConsentForm onAccept={() => {
        initCamera();
        setConsentGiven(true);
      }} />
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00ff41] flex items-center justify-center p-4 font-mono overflow-hidden relative">
        <div className="crt-overlay" />
        <div className="crt-vignette" />
        <div className="crt-reflection" />
        <div className="crt-curve" />
        <div className="scanline" />
        
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        {/* Meta Stats Overlay */}
        <div className="absolute top-10 right-10 text-right space-y-2">
          <div className="text-[10px] text-[#00ff41]/40 uppercase tracking-widest">Meta Credits</div>
          <div className="text-2xl font-black text-[#00ff41] drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">
            {Math.floor(metaPoints)}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 border-2 border-[#00ff41]/30 p-10 rounded-lg bg-black/80 backdrop-blur-xl relative shadow-[0_0_50px_rgba(0,255,65,0.1)]"
        >
          <div className="text-center space-y-4">
            <div className="inline-block p-4 rounded-full bg-[#00ff41]/10 border border-[#00ff41]/20 mb-2">
              <Mountain className="w-10 h-10 text-[#00ff41]" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-[#00ff41] drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">Void Signal Lab</h1>
            <p className="text-[#00ff41]/40 text-[10px] tracking-[0.3em] uppercase">Isolated Research Relay - Switzerland</p>
          </div>

            <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#00ff41]/60">Save Slot Identifier</label>
              <input 
                type="text" 
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="X-RAY-77"
                className="w-full bg-[#00ff41]/5 border-2 border-[#00ff41]/20 p-4 rounded focus:outline-none focus:border-[#00ff41]/60 transition-all text-center text-xl tracking-widest font-bold text-[#00ff41]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  playSound(UI_CLICK);
                  // Invoke native rust backend to request a Steam Matchmaking Lobby
                  invoke('create_lobby').catch(console.warn);
                }}
                className="bg-[#00ff41] text-black font-black p-5 rounded hover:bg-[#00ff41]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group text-sm tracking-widest"
              >
                HOST STEAM CO-OP
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => {
                  playSound(UI_CLICK);
                  // Emulate an offline host immediately
                  setIsHost(true);
                  setJoined(true);
                  setIntroComplete(true);
                }}
                className="border-2 border-[#00ff41]/30 text-[#00ff41] font-black p-5 rounded hover:bg-[#00ff41]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group text-sm tracking-widest"
              >
                START OFFLINE
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
               <button 
                onClick={() => {
                  const saved = localStorage.getItem(`void_signal_save_${roomId}`);
                  if (saved) {
                    playSound(UI_SUCCESS);
                    setGameState(JSON.parse(saved));
                    setIsHost(true);
                    setJoined(true);
                    setIntroComplete(true);
                  } else {
                    playSound(UI_ERROR);
                    alert("NO LOCAL SAVE FOUND FOR THIS ID.");
                  }
                }}
                className="border-2 border-yellow-500/30 text-yellow-500 font-black p-3 rounded hover:bg-yellow-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group tracking-widest text-xs"
              >
                LOAD LOCAL SAVE
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  playSound(UI_CLICK);
                  setShowHowToPlay(true);
                }}
                className="w-full border border-[#00ff41]/20 text-[#00ff41]/60 font-black p-3 rounded hover:bg-[#00ff41]/5 hover:text-[#00ff41] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs tracking-widest"
              >
                <FileText className="w-4 h-4" /> MANUAL
              </button>
            </div>
          </div>
        </motion.div>

        {/* How To Play Modal */}
        <AnimatePresence>
          {/* Meta Horror: Fake OS Crash Component */}
          {showFakeCrash && <FakeCrash />}

          {showHowToPlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="max-w-2xl w-full bg-[#050505] border border-[#00ff41]/30 rounded-lg p-8 shadow-[0_0_50px_rgba(0,255,65,0.1)] max-h-[80vh] overflow-y-auto custom-scrollbar relative"
              >
                <button 
                  onClick={() => {
                    playSound(UI_CLICK);
                    setShowHowToPlay(false);
                  }}
                  className="absolute top-4 right-4 text-[#00ff41]/40 hover:text-[#00ff41] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <h2 className="text-2xl font-black tracking-tighter uppercase italic text-[#00ff41] mb-6 border-b border-[#00ff41]/20 pb-4">
                  Void Signal Lab: Operations Manual
                </h2>
                
                <div className="space-y-6 text-sm text-[#00ff41]/80 leading-relaxed">
                  <section>
                    <h3 className="text-lg font-bold text-[#00ff41] mb-2">Synopsis</h3>
                    <p>
                      You and your partner are stationed at an isolated research relay in the Swiss Alps, tasked with listening to the void of deep space. Your job is to scan for anomalous signals, download them, process them, and sell the data to the highest bidder to fund facility upgrades. 
                    </p>
                    <p className="mt-2">
                      But the void is not empty. As you pull in more signals, the relay's systems will begin to degrade, and the isolation will take its toll. The things you are downloading are not just data. They are listening back. Survive the shift, upgrade the relay, and don't let the paranoia consume you.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-[#00ff41] mb-2">How to Play (Co-op)</h3>
                    <p>This is a 2-player asymmetric cooperative game. Both players must enter the same <strong>Relay Frequency ID</strong> to join the same session.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="border border-[#00ff41]/20 p-4 rounded bg-[#00ff41]/5">
                        <h4 className="font-bold text-[#00ff41] mb-2 flex items-center gap-2"><Radio className="w-4 h-4" /> Signal Specialist</h4>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Operates the deep-space antenna.</li>
                          <li>Scans the sky grid to locate anomalies.</li>
                          <li>Initiates downloads of raw signals.</li>
                          <li>Manages antenna heating during blizzards.</li>
                        </ul>
                      </div>
                      <div className="border border-[#00ff41]/20 p-4 rounded bg-[#00ff41]/5">
                        <h4 className="font-bold text-[#00ff41] mb-2 flex items-center gap-2"><Database className="w-4 h-4" /> Data Analyst</h4>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Processes the raw signals downloaded by the Specialist.</li>
                          <li>Completes Noise Filter and Decryption minigames.</li>
                          <li>Sells processed data for Credits.</li>
                          <li>Manages internal systems and lighting.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-[#00ff41] mb-2">Facility Management</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Credits (CR):</strong> Earned by selling processed signals. Used to buy upgrades in the Module Grid.</li>
                      <li><strong>Power:</strong> Drains constantly. If it hits 0%, systems fail. Buy Power Cores to restore it.</li>
                      <li><strong>Integrity:</strong> Decreases as you download dangerous signals. Low integrity makes minigames harder. Buy Hull Plating to repair.</li>
                      <li><strong>Paranoia:</strong> Increases over time and from strange events. High paranoia causes UI glitches, hallucinations, and system instability. Buy Sedatives to lower it.</li>
                      <li><strong>System Reboots:</strong> If a critical failure occurs, both players must coordinate a manual reboot sequence.</li>
                    </ul>
                  </section>

                  <section className="border border-red-500/20 p-4 rounded bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                    <h3 className="text-lg font-black text-red-500 mb-2 uppercase italic tracking-tighter">V4.0 SUPPLEMENT: THE VOID ECHOES</h3>
                    <ul className="space-y-3 text-[10px] uppercase font-mono tracking-widest leading-relaxed">
                      <li>
                        <span className="text-red-500 font-bold">SECONDARY VIGILANCE:</span> 
                        <br/>
                        Provide secondary input [MB2] on the scan matrix. It listens while you work. Efficiency is halved. The machines grow weary.
                      </li>
                      <li>
                        <span className="text-red-500 font-bold">ENCRYPTED FRAGMENTS:</span>
                        <br/>
                        Rare anomalies [0.5% chance] require frequency alignment. Both operators must touch the wave. Decryption will bleed your power dry.
                      </li>
                      <li>
                        <span className="text-red-500 font-bold">ANOMALOUS HARDWARE:</span>
                        <br/>
                        Success yields a prototype. They are unstable. Their stats are unknown. Do not look directly at the EXOTIC grades.
                      </li>
                    </ul>
                  </section>
                  
                  <section className="border-t border-red-500/30 pt-4 mt-8">
                    <p className="text-red-500/80 text-xs italic text-center">
                      "If you hear tapping on the exterior windows, ignore it. We are 5000 meters above sea level."
                    </p>
                  </section>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00ff41] flex items-center justify-center p-4 font-mono relative overflow-hidden">
        <div className="crt-overlay" />
        <div className="crt-vignette" />
        <div className="crt-reflection" />
        <div className="crt-curve" />
        <div className="scanline" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full relative z-10">
          <RoleCard 
            title="SIGNAL SPECIALIST" 
            icon={<Radio className="w-12 h-12" />}
            description="Operates the deep-space antenna. Scans the sky for anomalies and initiates downloads."
            onClick={() => {
              playSound(UI_CLICK);
              selectRole('specialist');
            }}
            disabled={gameState?.specialist !== null}
          />
          <RoleCard 
            title="DATA ANALYST" 
            icon={<Database className="w-12 h-12" />}
            description="Processes raw signals. Filters noise, decrypts data, and prepares reports for sale."
            onClick={() => {
              playSound(UI_CLICK);
              selectRole('analyst');
            }}
            disabled={gameState?.analyst !== null}
          />
        </div>
      </div>
    );
  }

  if (!introComplete) {
    return <TerminalIntro role={role} onComplete={() => setIntroComplete(true)} />;
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#050505] text-[#00ff41] font-mono flex flex-col selection:bg-[#00ff41] selection:text-black relative overflow-hidden transition-all duration-1000",
      isDark ? "brightness-[0.2]" : "brightness-100",
      isFlickering && "crt-flicker",
      paranoiaLevel > 50 && "paranoia-pulse",
      paranoiaLevel > 80 && Math.random() > 0.95 && "animate-glitch"
    )}>
      {/* CRT Visual Stack */}
      <div className="crt-overlay" />
      <div className="crt-vignette" />
      <div className="crt-reflection" />
      <div className="crt-curve" />
      <div className="scanline" />

      {/* 2.5D Depth Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />

      {/* Admin Console */}
      <AnimatePresence>
        {adminMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-8 z-[200] bg-black/90 border border-red-500/50 p-6 backdrop-blur-md w-80 space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          >
            <div className="flex justify-between items-center border-b border-red-500/20 pb-2">
              <h3 className="text-red-500 font-black italic uppercase tracking-tighter text-sm">Admin Override</h3>
              <button onClick={() => setAdminMode(false)} className="text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { id: 'footsteps', label: 'Footsteps' },
                { id: 'temp_drop', label: 'Temp Drop' },
                { id: 'glitch', label: 'Glitch' },
                { id: 'whisper', label: 'Whisper' },
                { id: 'shadow', label: 'Shadow' },
                { id: 'door', label: 'Door' },
                { id: 'breathing', label: 'Breathing' },
                { id: 'static', label: 'Static' },
                { id: 'power_surge', label: 'Power Surge' },
                { id: 'window_tap', label: 'Window Tap' },
                { id: 'radio_chatter', label: 'Radio Chatter' },
                { id: 'hallucination', label: 'Hallucination' },
                { id: 'system_reboot', label: 'System Reboot' },
                { id: 'gaslight_analyst', label: 'Gaslight Analyst' },
                { id: 'gaslight_specialist', label: 'Gaslight Specialist' },
                { id: 'fake_disconnect', label: 'Fake Disconnect' }
              ].map(event => (
                <button 
                  key={event.id}
                  onClick={() => dispatchGameAction('admin-trigger-event', { eventId: event.id })}
                  className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/40 transition-all text-red-500/60 hover:text-red-500"
                >
                  Trigger {event.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shadow Figure */}
      <AnimatePresence>
        {showShadow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: paranoiaLevel > 80 ? [shadowIntensity, shadowIntensity * 0.1, shadowIntensity * 0.8, 0, shadowIntensity] : shadowIntensity,
              filter: `blur(${Math.max(2, 8 - (paranoiaLevel / 15))}px) contrast(${100 + paranoiaLevel}%)`,
              skewX: paranoiaLevel > 70 ? [0, 2, -2, 0] : 0,
              scaleY: paranoiaLevel > 90 ? [1, 1.05, 0.95, 1] : 1,
              x: paranoiaLevel > 85 ? [0, -5, 5, -2, 2, 0] : 0
            }}
            transition={{
              opacity: { repeat: Infinity, duration: paranoiaLevel > 80 ? 0.15 : 2, repeatType: "mirror" },
              skewX: { repeat: Infinity, duration: 0.1, repeatType: "mirror" },
              scaleY: { repeat: Infinity, duration: 0.15, repeatType: "mirror" },
              x: { repeat: Infinity, duration: 0.08, repeatType: "mirror" }
            }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed pointer-events-none z-[100]",
              shadowPosition === 'right-close' && "bottom-0 right-10 w-[20vw] h-[75vh]",
              shadowPosition === 'right-far' && "bottom-10 right-[20%] w-[10vw] h-[45vh]",
              shadowPosition === 'left-close' && "bottom-0 left-10 w-[25vw] h-[80vh]",
              shadowPosition === 'left-far' && "bottom-10 left-[20%] w-[12vw] h-[50vh]",
              shadowPosition === 'center-far' && "bottom-20 left-1/2 -translate-x-1/2 w-[8vw] h-[35vh]",
              shadowPosition === 'ceiling' && "top-0 left-1/3 w-[25vw] h-[40vh] rotate-180"
            )}
          >
            <svg viewBox="0 0 200 600" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]" preserveAspectRatio="xMidYMax meet">
              <defs>
                <filter id="charcoal" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g filter="url(#charcoal)">
                {shadowForm === 0 && (
                  <>
                    {/* Aura / Scribble background */}
                    <path d="M 60 100 Q 50 300 55 600 L 145 600 Q 150 300 140 100 Z" fill="black" opacity="0.5" />
                    <path d="M 40 150 Q 30 350 45 600 L 155 600 Q 170 350 160 150 Z" fill="black" opacity="0.3" />
                    
                    {/* Main Body */}
                    <path d="M 80 120 Q 75 300 85 600 L 115 600 Q 125 300 120 120 Z" fill="black" />
                    
                    {/* Head */}
                    <ellipse cx="100" cy="90" rx="22" ry="30" fill="black" />
                    
                    {/* Left Arm (Long, spindly) */}
                    <path d="M 80 120 Q 60 250 55 400 Q 50 450 45 480 L 50 480 Q 55 450 65 400 Q 75 250 90 150 Z" fill="black" />
                    {/* Left Claws */}
                    <path d="M 45 480 L 40 530 L 48 485 L 52 535 L 53 485 L 60 525 Z" fill="black" />

                    {/* Right Arm */}
                    <path d="M 120 120 Q 140 250 145 400 Q 150 450 155 480 L 150 480 Q 145 450 135 400 Q 125 250 110 150 Z" fill="black" />
                    {/* Right Claws */}
                    <path d="M 155 480 L 160 530 L 152 485 L 148 535 L 147 485 L 140 525 Z" fill="black" />
                  </>
                )}

                {shadowForm === 1 && (
                  <>
                    {/* The Watcher - Bulky, wide */}
                    <path d="M 30 120 Q 100 40 170 120 Q 200 300 200 600 L 0 600 Q 0 300 30 120 Z" fill="black" opacity="0.4" />
                    <path d="M 50 150 Q 100 80 150 150 Q 180 300 190 600 L 10 600 Q 20 300 50 150 Z" fill="black" />
                  </>
                )}

                {shadowForm === 2 && (
                  <>
                    {/* The Faceless - Extremely slender, elongated */}
                    <path d="M 80 80 Q 85 300 70 600 L 130 600 Q 115 300 120 80 Z" fill="black" opacity="0.3" />
                    <path d="M 90 100 Q 95 300 90 600 L 110 600 Q 105 300 110 100 Z" fill="black" />
                    <ellipse cx="100" cy="70" rx="12" ry="25" fill="black" />
                    <path d="M 90 100 Q 70 300 60 550 Q 65 560 70 550 Q 80 300 95 120 Z" fill="black" />
                    <path d="M 110 100 Q 130 300 140 550 Q 135 560 130 550 Q 120 300 105 120 Z" fill="black" />
                  </>
                )}
              </g>

              {/* Face (Glowing) */}
              <g filter="url(#glow)" fill="white">
                {shadowForm === 0 && (
                  <>
                    {/* Eyes */}
                    <path d="M 86 83 Q 90 80 93 85 Q 90 87 86 83 Z" />
                    <path d="M 107 85 Q 110 80 114 83 Q 110 87 107 85 Z" />
                    {/* Jagged Teeth */}
                    <path d="M 90 100 L 93 92 L 96 102 L 99 91 L 101 103 L 104 91 L 107 102 L 110 92 L 110 100 L 107 108 L 104 100 L 101 110 L 99 100 L 96 108 L 93 100 Z" />
                  </>
                )}

                {shadowForm === 1 && (
                  <>
                    {/* Many scattered eyes */}
                    <circle cx="100" cy="120" r="4" />
                    <circle cx="80" cy="140" r="3" />
                    <circle cx="120" cy="135" r="5" />
                    <circle cx="90" cy="160" r="2" />
                    <circle cx="110" cy="170" r="3" />
                    <circle cx="130" cy="110" r="2" />
                    <circle cx="70" cy="115" r="4" />
                    <circle cx="105" cy="145" r="2" />
                    <circle cx="95" cy="130" r="3" />
                  </>
                )}

                {shadowForm === 2 && (
                  <>
                    {/* Single vertical glowing slit */}
                    <path d="M 98 60 Q 100 50 102 60 L 100 80 Z" />
                  </>
                )}
              </g>
            </svg>

            {/* High Paranoia Distortions (Duplicate layers slightly offset) */}
            {paranoiaLevel > 70 && (
              <>
                <motion.div 
                  animate={{ x: [-3, 3, -1, 2], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ repeat: Infinity, duration: 0.08 }}
                  className="absolute inset-0 bg-black mix-blend-overlay"
                  style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
                />
              </>
            )}
            
            {/* Intense Glitch for very high paranoia */}
            {paranoiaLevel > 85 && (
              <motion.div 
                animate={{ 
                  x: [0, -5, 5, 0, -2, 2],
                  y: [0, 2, -2, 0, 5, -5],
                  opacity: [0.1, 0.4, 0.1, 0.5]
                }}
                transition={{ repeat: Infinity, duration: 0.1, repeatType: "mirror" }}
                className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/tv-noise.png')] opacity-30 mix-blend-color-dodge"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paranoia Glitch Overlay */}
      <AnimatePresence>
        {paranoiaLevel > 30 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: (paranoiaLevel - 30) / 100 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[60] bg-red-900/5 mix-blend-overlay animate-pulse"
          />
        )}
      </AnimatePresence>

      {/* Header HUD */}
      <header className="border-b border-[#00ff41]/20 p-6 flex items-center justify-between bg-black/90 backdrop-blur-xl sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#00ff41]/40 uppercase tracking-widest">
              <AbyssalHallucination text="Research Day" paranoia={paranoiaLevel} />
            </span>
            <span className="text-2xl font-black italic">
              <AbyssalHallucination text={`DAY ${gameState?.day || 1}`} paranoia={paranoiaLevel} />
            </span>
          </div>
          <div className="h-10 w-px bg-[#00ff41]/20" />
          <div className="flex flex-col">
            <span className="text-[10px] text-[#00ff41]/40 uppercase tracking-widest">Local Time</span>
            <span className="text-2xl font-black italic">
              {Math.floor((gameState?.time || 480) / 60).toString().padStart(2, '0')}:
              {((gameState?.time || 480) % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-6">
            <div className="relative">
               <Meter label={<AbyssalHallucination text="POWER" paranoia={paranoiaLevel} />} value={gameState?.power || 0} color="text-yellow-500" />
               {gameState?.findingsFile?.status === 'unlocking' && (
                  <div className="absolute -top-4 right-0 text-[10px] text-red-500 font-black animate-pulse flex items-center gap-1">
                     <Zap className="w-2 h-2" /> DRAIN: CRITICAL
                  </div>
               )}
            </div>
            <Meter label={<AbyssalHallucination text="INTEGRITY" paranoia={paranoiaLevel} />} value={gameState?.integrity || 0} color="text-blue-500" />
            <Meter label={<AbyssalHallucination text="PARANOIA" paranoia={paranoiaLevel} />} value={gameState?.paranoia || 0} color="text-red-500" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#00ff41]/40 uppercase tracking-widest block mb-1">Credits</span>
            <span className="text-2xl font-black text-[#00ff41] drop-shadow-[0_0_8px_rgba(0,255,65,0.4)]">
              {gameState?.points || 0}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowWindow(!showWindow)}
              className={cn(
                "p-2 border rounded transition-all",
                showWindow ? "border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41]" : "border-[#00ff41]/20 text-[#00ff41]/40 hover:bg-[#00ff41]/10"
              )}
              title="Toggle Window View"
            >
              <Mountain className="w-4 h-4" />
            </button>
            <button 
              onClick={saveGame}
              className="p-2 border border-[#00ff41]/20 rounded hover:bg-[#00ff41]/10 transition-all"
              title="Save Game"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className={cn(
              "w-12 h-12 rounded border flex items-center justify-center",
              role === 'specialist' ? "border-[#00ff41]/50 bg-[#00ff41]/10" : "border-[#00ff41]/30 bg-black"
            )}>
              {role === 'specialist' ? <Radio className="w-6 h-6" /> : <Database className="w-6 h-6" />}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#00ff41]/20 bg-black/50 z-30">
        <button 
          onClick={() => setActiveTab('main')}
          className={cn(
            "px-8 py-3 text-[10px] font-black uppercase tracking-widest border-r border-[#00ff41]/20 transition-all",
            activeTab === 'main' ? "bg-[#00ff41]/10 text-[#00ff41]" : "text-[#00ff41]/40 hover:text-[#00ff41]/60"
          )}
        >
          Relay Operations
        </button>
        <button 
          onClick={() => setActiveTab('upgrades')}
          className={cn(
            "px-8 py-3 text-[10px] font-black uppercase tracking-widest border-r border-[#00ff41]/20 transition-all",
            activeTab === 'upgrades' ? "bg-[#00ff41]/10 text-[#00ff41]" : "text-[#00ff41]/40 hover:text-[#00ff41]/60"
          )}
        >
          Module Grid
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={cn(
            "px-8 py-3 text-[10px] font-black uppercase tracking-widest border-r border-[#00ff41]/20 transition-all",
            activeTab === 'security' ? "bg-[#00ff41]/10 text-[#00ff41]" : "text-[#00ff41]/40 hover:text-[#00ff41]/60"
          )}
        >
          Security Feeds
        </button>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 perspective-1000">
        {/* Main Interaction Zone */}
        <div className="lg:col-span-8 p-12 flex flex-col items-center justify-center relative bg-black overflow-hidden transform-style-3d">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          {/* Minigame Overlay */}
          <AnimatePresence>
            {activeMinigame && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-12"
              >
                <div className="w-full max-w-md space-y-8">
                  <div className="flex justify-between items-center border-b border-[#00ff41]/20 pb-4">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                      {activeMinigame.type === 'filter' ? <Filter className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      {activeMinigame.type === 'filter' ? 'Noise Cancellation' : 'Pattern Decryption'}
                    </h3>
                    <div className="text-right">
                      <div className="text-[8px] text-[#00ff41]/40 uppercase tracking-widest mb-1">Time Remaining</div>
                      <div className={cn(
                        "text-lg font-black tabular-nums",
                        activeMinigame.timeLeft < 5 ? "text-red-500 animate-pulse" : "text-[#00ff41]"
                      )}>
                        {activeMinigame.timeLeft.toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {/* Timer Bar */}
                  <div className="h-1 bg-[#00ff41]/10 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn(
                        "h-full",
                        activeMinigame.timeLeft < 5 ? "bg-red-500" : "bg-[#00ff41]"
                      )}
                      initial={{ width: "100%" }}
                      animate={{ width: `${(activeMinigame.timeLeft / activeMinigame.maxTime) * 100}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>

                  {activeMinigame.type === 'filter' ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-[#00ff41]/60 uppercase tracking-widest">
                          Toggle polarity to reach zero net interference
                        </p>
                        {gameState.integrity < 50 && (
                          <span className="text-[8px] text-red-500 font-black animate-pulse uppercase">Signal Corrupted</span>
                        )}
                      </div>
                      <div className={cn(
                        "grid gap-2",
                        activeMinigame.data.length > 16 ? "grid-cols-5" : "grid-cols-4"
                      )}>
                        {activeMinigame.data.map((val: number, i: number) => (
                          <button 
                            key={i}
                            onClick={() => {
                              playSound(UI_CLICK, 0.1);
                              const newData = [...activeMinigame.data];
                              newData[i] = -newData[i];
                              setActiveMinigame({ ...activeMinigame, data: newData });
                              if (newData.reduce((a, b) => a + b, 0) === 0) {
                                setTimeout(completeMinigame, 500);
                              }
                            }}
                            className={cn(
                              "aspect-square flex items-center justify-center text-xs font-bold border transition-all",
                              val > 0 ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" : "border-red-500/40 text-red-400 bg-red-500/5",
                              gameState.integrity < 30 && Math.random() > 0.95 && "blur-[2px]" // Visual corruption
                            )}
                          >
                            {val > 0 ? `+${val}` : val}
                          </button>
                        ))}
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] text-[#00ff41]/40 uppercase tracking-widest mb-1">Net Interference</div>
                        <div className={cn(
                          "text-2xl font-black",
                          activeMinigame.data.reduce((a: number, b: number) => a + b, 0) === 0 ? "text-[#00ff41]" : "text-white/20"
                        )}>
                          {activeMinigame.data.reduce((a: number, b: number) => a + b, 0)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-[#00ff41]/60 uppercase tracking-widest">
                          Replicate the target sequence
                        </p>
                        {gameState.integrity < 50 && (
                          <span className="text-[8px] text-red-500 font-black animate-pulse uppercase">Signal Corrupted</span>
                        )}
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        {activeMinigame.data.target.map((sym: string, i: number) => (
                          <div 
                            key={i}
                            className={cn(
                              "w-10 h-10 border border-[#00ff41]/20 flex items-center justify-center text-xl",
                              activeMinigame.data.current.length > i ? "text-[#00ff41] border-[#00ff41]" : "text-[#00ff41]/20",
                              gameState.integrity < 40 && Math.random() > 0.9 && "blur-[1px] skew-x-12"
                            )}
                          >
                            {sym}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {activeMinigame.data.symbols.map((sym: string, i: number) => (
                          <button 
                            key={i}
                            onClick={() => {
                              playSound(UI_CLICK, 0.1);
                              const newCurrent = [...activeMinigame.data.current, sym];
                              if (newCurrent[newCurrent.length - 1] !== activeMinigame.data.target[newCurrent.length - 1]) {
                                // Reset on wrong symbol
                                playSound(UI_ERROR, 0.1);
                                setActiveMinigame({ ...activeMinigame, data: { ...activeMinigame.data, current: [] } });
                                return;
                              }
                              
                              setActiveMinigame({ ...activeMinigame, data: { ...activeMinigame.data, current: newCurrent } });
                              
                              if (newCurrent.length === activeMinigame.data.target.length) {
                                setTimeout(completeMinigame, 500);
                              }
                            }}
                            className="aspect-square border border-[#00ff41]/20 hover:bg-[#00ff41]/10 flex items-center justify-center text-xl transition-all"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {activeTab === 'security' && (
            <div className="flex-1 p-8 grid grid-cols-2 gap-4">
              {[
                { name: 'CAM_01_AIRLOCK', status: 'ONLINE', noise: 0.1 },
                { name: 'CAM_02_CORRIDOR_B', status: 'ONLINE', noise: 0.3 },
                { name: 'CAM_03_REACTOR', status: 'OFFLINE', noise: 1 },
                { name: 'CAM_04_EXTERIOR', status: 'ONLINE', noise: 0.8 }
              ].map((cam, i) => (
                <div key={i} className="border border-[#00ff41]/20 bg-black/40 relative overflow-hidden h-64 flex flex-col">
                  <div className="p-2 border-b border-[#00ff41]/20 flex justify-between items-center bg-black/60 z-10">
                    <span className="text-[10px] font-black tracking-widest">{cam.name}</span>
                    <span className={cn("text-[10px] font-bold", cam.status === 'OFFLINE' ? "text-red-500 animate-pulse" : "text-[#00ff41]")}>{cam.status}</span>
                  </div>
                  <div className="flex-1 relative">
                    {cam.status === 'ONLINE' ? (
                      <>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="${cam.noise}" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>')` }} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                        {/* Occasional creepy shadow in the camera */}
                        {paranoiaLevel > 60 && Math.random() > 0.95 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <div className="w-12 h-32 bg-black blur-sm rounded-full" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 text-[8px] opacity-50 font-mono">
                          REC • {new Date().toISOString().split('T')[1].substring(0, 8)}
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-red-500/50 font-mono text-xs">NO SIGNAL</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'main' ? (
            <>
              <AnimatePresence>
                {showWindow && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full max-w-4xl mx-auto px-8 mb-8 overflow-hidden"
                  >
                    <WindowView paranoia={paranoiaLevel} isDark={isDark} />
                    <div className="mt-2 text-[8px] text-[#00ff41]/40 uppercase tracking-widest text-center">
                      External Visual Sensor - Relay 04
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {role === 'specialist' ? (
                <motion.div 
                  initial={{ rotateX: 5, rotateY: -5 }} animate={{ rotateX: 0, rotateY: 0 }}
                  className="w-full max-w-4xl space-y-8 relative z-20"
                >
                  <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-4">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                      <Search className="w-5 h-5 text-[#00ff41]" /> {getLabel("Sky Scan Matrix", "The Void")}
                    </h3>
                    <div className="flex items-center gap-4">
                      {gameState?.weather === 'blizzard' && gameState?.antennaFrozen && (
                        <button 
                          onClick={() => {
                            playSound(UI_CLICK);
                            dispatchGameAction('heat-antenna', { role });
                          }}
                          className="px-3 py-1.5 bg-orange-500/20 text-orange-500 border border-orange-500/50 rounded text-[8px] font-black uppercase tracking-widest hover:bg-orange-500/40 transition-all animate-pulse"
                        >
                          Heat Antenna (15 PWR)
                        </button>
                      )}
                      <SystemToggle 
                        active={gameState?.systems?.scanning} 
                        onClick={() => toggleSystem('scanning')}
                        label={<AbyssalHallucination text="SCANNER" paranoia={paranoiaLevel} />}
                      />
                      <button 
                        onClick={repairAntenna}
                        className="p-2 border border-[#00ff41]/20 rounded hover:bg-[#00ff41]/10 transition-all text-[#00ff41]"
                        title="Repair Antenna"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className={cn(
                    "grid grid-cols-10 gap-1 p-4 border border-[#00ff41]/20 bg-black rounded shadow-[inset_0_0_50px_rgba(0,255,65,0.1)] transition-opacity",
                    !gameState?.systems?.scanning && "opacity-20 pointer-events-none"
                  )}>
                    {Array(100).fill(0).map((_, i) => {
                      const x = i % 10;
                      const y = Math.floor(i / 10);
                      const isActive = gameState?.activeSignal?.coordinates?.x === x && gameState?.activeSignal?.coordinates?.y === y;
                      const isScanning = scanning?.x === x && scanning?.y === y;
                      
                      return (
                        <button 
                          key={i}
                          onContextMenu={(e) => {
                             e.preventDefault();
                             if (!gameState?.backgroundScan?.active && gameState?.systems?.scanning) {
                                playSound(UI_CLICK);
                                dispatchGameAction('start-background-scan', { role, x, y });
                             }
                          }}
                          onClick={() => {
                            playSound(UI_CLICK);
                            scanSky(x, y);
                          }}
                          className={cn(
                            "aspect-square border border-[#00ff41]/5 transition-all relative group",
                            isActive ? "bg-[#00ff41]/20 border-[#00ff41]/40" : "hover:bg-[#00ff41]/10",
                            isScanning && "animate-pulse bg-[#00ff41]/30",
                            gameState?.backgroundScan?.x === x && gameState?.backgroundScan?.y === y && gameState?.backgroundScan?.active && "bg-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.5)]"
                          )}
                        >
                          {isActive && <AlertCircle className="w-4 h-4 text-[#00ff41] absolute inset-0 m-auto animate-ping" />}
                          {gameState?.backgroundScan?.x === x && gameState?.backgroundScan?.y === y && gameState?.backgroundScan?.active && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="w-2 h-2 text-blue-400 animate-spin" />
                             </div>
                          )}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[6px] text-[#00ff41]/40">
                            {x},{y}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {gameState?.activeSignal && (
                    <div className="w-full p-6 border-2 border-[#00ff41]/40 bg-[#00ff41]/10 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(0,255,65,0.1)] space-y-6">
                      <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-4">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <Radio className="w-3 h-3 text-[#00ff41] animate-pulse" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#00ff41]">Anomalous Acquisition</h4>
                          </div>
                          <p className="text-[10px] text-[#00ff41]/60 uppercase font-mono">
                            LOCK: [ {gameState.activeSignal.coordinates.x}, {gameState.activeSignal.coordinates.y} ] • FREQ: {gameState.activeSignal.frequency}MHz
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] font-black uppercase text-[#00ff41]">RESONANCE: {(Math.abs(gameState.activeSignal.targetPolarity - (gameState.activeSignal.userPolarity || 0)) <= 15 && Math.abs(gameState.activeSignal.targetRotation - (gameState.activeSignal.userRotation || 0)) <= 10) ? 'SYNCED' : 'UNSTABLE'}</div>
                          <div className="text-[10px] font-black text-[#00ff41]">{gameState.activeSignal.progress}%</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="flex justify-between text-[8px] font-black uppercase text-[#00ff41]/60">
                            <span>Polarity (Phase)</span>
                            <span>{gameState.activeSignal.userPolarity || 0}°</span>
                          </div>
                          <input 
                            type="range" min="0" max="360" 
                            value={gameState.activeSignal.userPolarity || 0}
                            onChange={(e) => dispatchGameAction('update-resonance', { polarity: parseInt(e.target.value) })}
                            className="w-full accent-[#00ff41] bg-[#00ff41]/10 rounded-full"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[8px] font-black uppercase text-[#00ff41]/60">
                            <span>Rotation (Alignment)</span>
                            <span>{gameState.activeSignal.userRotation || 0}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="100" 
                            value={gameState.activeSignal.userRotation || 0}
                            onChange={(e) => dispatchGameAction('update-resonance', { rotation: parseInt(e.target.value) })}
                            className="w-full accent-[#00ff41] bg-[#00ff41]/10 rounded-full"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          playSound(UI_CLICK);
                          dispatchGameAction('download-progress', { role });
                        }}
                        className={cn(
                          "w-full py-3 rounded font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                          (Math.abs(gameState.activeSignal.targetPolarity - (gameState.activeSignal.userPolarity || 0)) <= 15 && Math.abs(gameState.activeSignal.targetRotation - (gameState.activeSignal.userRotation || 0)) <= 10)
                            ? "bg-[#00ff41] text-black shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:bg-[#00ff41]/80 animate-pulse"
                            : "bg-red-500/20 text-red-500 border border-red-500/50 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Download className={cn("w-4 h-4", (Math.abs(gameState.activeSignal.targetPolarity - (gameState.activeSignal.userPolarity || 0)) <= 15 && Math.abs(gameState.activeSignal.targetRotation - (gameState.activeSignal.userRotation || 0)) <= 10) && "animate-bounce")} /> 
                        {(Math.abs(gameState.activeSignal.targetPolarity - (gameState.activeSignal.userPolarity || 0)) <= 15 && Math.abs(gameState.activeSignal.targetRotation - (gameState.activeSignal.userRotation || 0)) <= 10)
                          ? (paranoiaLevel > 90 ? "SEIZING ARCHIVE..." : "ACQUIRING SIGNAL...") 
                          : "RESONANCE REQUIRED"}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ rotateX: -5, rotateY: 5 }} animate={{ rotateX: 0, rotateY: 0 }}
                  className="w-full max-w-4xl space-y-8 relative z-20"
                >
                  <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-4">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-[#00ff41]">
                       <Database className="w-5 h-5 text-[#00ff41]" /> {getLabel("Data Archive & Downlink", "The Void")}
                    </h3>
                  </div>

                  {/* [ANALYST] TRANSLATION MATRIX (RESTORED) */}
                  <div className="w-full p-6 border border-[#00ff41]/20 bg-[#00ff41]/5 rounded backdrop-blur-md">
                    <h3 className="text-sm font-black italic uppercase tracking-widest text-[#00ff41]/60 mb-6 flex items-center gap-2">
                       <Lock className="w-4 h-4 text-[#00ff41]" /> Intelligence Processing
                    </h3>
                    {gameState?.signals?.filter((s:any) => s.status === 'raw').length === 0 ? (
                      <div className="p-10 border border-dashed border-[#00ff41]/10 rounded flex flex-col items-center justify-center text-[#00ff41]/30 space-y-3 bg-black/40">
                        <Activity className="w-8 h-8 opacity-10 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest">No raw signals in buffer. Waiting for Specialist...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gameState.signals.filter((s:any) => s.status === 'raw').map((signal: any) => (
                          <div key={signal.id} className="p-4 border border-[#00ff41]/20 bg-[#00ff41]/5 rounded space-y-3 group text-left">
                             <div className="flex justify-between items-center border-b border-[#00ff41]/10 pb-2">
                               <div className="text-[8px] font-black uppercase text-[#00ff41]">SIG_{signal.id}</div>
                               <div className="text-[8px] px-2 py-0.5 bg-[#00ff41]/10 rounded text-[#00ff41]">{signal.progress}%</div>
                             </div>
                             <div className="flex gap-2">
                               <button 
                                 onClick={() => {
                                   playSound(UI_CLICK);
                                   dispatchGameAction('process-signal', { role, signalId: signal.id });
                                 }}
                                 className="flex-1 py-1.5 rounded border border-[#00ff41]/30 hover:bg-[#00ff41]/10 text-[#00ff41] text-[8px] font-black uppercase tracking-widest transition-all"
                               >
                                 Decrypt Phase
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity",
                    !gameState?.systems?.processing && "opacity-20 pointer-events-none"
                  )}>
                    {gameState?.findingsFile?.status === 'ready' && role === 'analyst' && (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="col-span-2 p-8 border-2 border-[#00ff41] bg-[#00ff41]/10 rounded-xl mb-4 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,255,65,0.2)]"
                      >
                         <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#00ff41] rounded-full">
                               <Zap className="w-8 h-8 text-black animate-pulse" />
                            </div>
                            <div className="text-left">
                               <h2 className="text-xl font-black text-[#00ff41] italic tracking-tighter">PROTOTYPE HARVEST READY</h2>
                               <p className="text-[10px] text-[#00ff41]/60 font-mono mt-1 tracking-[0.3em] uppercase">QUANTUM SIGNATURE STABILIZED • {gameState.findingsFile.tier.toUpperCase()} GRADE</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => {
                               playSound(UI_SUCCESS);
                               const proto = generatePrototypeModule(gameState.findingsFile.tier);
                               dispatchGameAction('install-module', { role, module: 'prototype', x: 0, y: 0, proto });
                               dispatchGameAction('claim-prototype', { role });
                           }}
                           className="w-full max-md py-4 bg-[#00ff41] text-black font-black text-xs uppercase tracking-widest hover:bg-[#00ff41]/80 transition-all rounded shadow-[0_0_30px_rgba(0,255,65,0.4)]"
                         >
                           INTEGRATE PROTOTYPE MODULE
                         </button>
                      </motion.div>
                    )}

                    {gameState?.signals?.length === 0 ? (
                      <div className="col-span-2 p-12 border border-dashed border-[#00ff41]/20 rounded flex flex-col items-center justify-center text-[#00ff41]/40 space-y-4">
                        <Activity className="w-12 h-12 opacity-20" />
                        <span className="text-xs uppercase tracking-widest">Waiting for data lock...</span>
                      </div>
                    ) : (
                      gameState.signals.filter((s:any) => s.status === 'processed').map((signal: any) => (
                        <div key={signal.id} className="p-6 border border-[#00ff41]/20 bg-[#00ff41]/5 rounded space-y-4 relative overflow-hidden group backdrop-blur-md text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-[8px] text-[#00ff41]/40 uppercase tracking-widest">Signal ID: {signal.id}</div>
                              <h4 className={cn(
                            "text-lg font-black italic uppercase",
                            signal.type === 'VOID_WHISPER' ? "text-red-600 animate-pulse" : "text-[#00ff41]"
                          )}>{signal.type}</h4>
                            </div>
                            <span className={cn(
                              "text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest",
                              signal.status === 'processed' ? "bg-[#00ff41] text-black" : "bg-white/10 text-white/60"
                            )}>
                              {signal.status}
                            </span>
                          </div>

                          {signal.lore && (
                            <div className="p-3 border border-[#00ff41]/20 bg-[#00ff41]/5 rounded text-[10px] italic text-[#00ff41]/80 leading-relaxed uppercase tracking-wider">
                              "{signal.lore}"
                            </div>
                          )}

                          <button 
                            onClick={() => {
                              playSound(UI_SUCCESS);
                              sellSignal(signal.id);
                            }}
                            title={paranoiaLevel > 80 && Math.random() > 0.5 ? "Why are you doing this?" : "Transmit data to Earth"}
                            className={cn(
                              "w-full bg-[#00ff41] text-black py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-[#00ff41]/80 transition-all flex items-center justify-center gap-2",
                              paranoiaLevel > 85 && Math.random() > 0.8 && "skew-x-6 scale-95"
                            )}
                          >
                            <DollarSign className="w-4 h-4" /> {paranoiaLevel > 95 && Math.random() > 0.5 ? "SELL YOUR SOUL" : `Sell Data (+${signal.value} CR)`}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {gameState?.findingsFile?.status === 'syncing' && role === 'specialist' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-xl"
                  >
                    <div className="w-full max-w-2xl p-12 border border-[#00ff41]/40 bg-black/80 rounded-2xl shadow-[0_0_100px_rgba(0,255,65,0.2)]">
                       <div className="text-center mb-12">
                         <h2 className="text-3xl font-black text-[#00ff41] animate-pulse">ESTABLISHING HANDSHAKE</h2>
                         <p className="text-xs text-[#00ff41]/60 tracking-[0.3em] font-mono mt-2">MATCH FREQUENCY TO SECURE FRAGMENT</p>
                       </div>
                       
                       <div className="h-64 bg-black/60 border border-[#00ff41]/20 rounded relative overflow-hidden mb-12">
                          <div className="absolute inset-0 flex items-center justify-center opacity-30">
                             <Activity className="w-48 h-48 animate-pulse text-[#00ff41]" />
                          </div>
                          <svg viewBox="0 0 800 200" className="absolute inset-0 w-full h-full">
                             {/* Static background waves */}
                             {[0.2, 0.1, 0.05].map((op, i) => (
                               <motion.path 
                                 key={i}
                                 animate={{ d: [
                                   `M 0 100 Q 100 ${80 + i*10} 200 100 T 400 100 T 600 100 T 800 100`,
                                   `M 0 100 Q 100 ${120 - i*10} 200 100 T 400 100 T 600 100 T 800 100`,
                                   `M 0 100 Q 100 ${80 + i*10} 200 100 T 400 100 T 600 100 T 800 100`
                                 ] }}
                                 transition={{ duration: 1 + i, repeat: Infinity, ease: "easeInOut" }}
                                 fill="none"
                                 stroke="#00ff41"
                                 strokeWidth="1"
                                 opacity={op}
                               />
                             ))}
                             {/* Main Sync wave */}
                             <motion.path 
                               animate={{ 
                                 d: ["M 0 100 Q 100 80 200 100 T 400 100 T 600 100 T 800 100", "M 0 100 Q 100 120 200 100 T 400 100 T 600 100 T 800 100", "M 0 100 Q 100 80 200 100 T 400 100 T 600 100 T 800 100"],
                                 strokeWidth: [2, 4, 2],
                                 opacity: [0.8, 1, 0.8]
                               }}
                               transition={{ duration: 0.5, repeat: Infinity }}
                               fill="none"
                               stroke="#00ff41"
                               className="drop-shadow-[0_0_15px_rgba(100,255,100,0.8)]"
                             />
                          </svg>
                          <div className="absolute top-4 left-4 text-[8px] font-mono text-[#00ff41]/40 uppercase tracking-widest">
                             Fragment Sync: {Math.random().toFixed(4)} Hz
                          </div>
                       </div>

                       <div className="flex flex-col items-center gap-6">
                          <button 
                             onClick={() => {
                                playSound(UI_CLICK);
                                dispatchGameAction('findings-handshake-complete');
                             }}
                             className="w-full py-6 bg-[#00ff41] text-black font-black text-xl hover:bg-[#00ff41]/80 transition-all rounded shadow-[0_0_30px_rgba(0,255,65,0.4)]"
                          >
                             INITIATE DEEP DECRYPTION
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Finding Found / discovery UI */}
              <AnimatePresence>
                {gameState?.findingsFile?.status === 'found' && (
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[80] p-6 bg-red-900/90 border-2 border-red-500 rounded-lg shadow-2xl flex items-center gap-6"
                  >
                    <div className="p-3 bg-red-500 rounded-full animate-ping">
                       <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <h4 className="font-black text-white text-lg italic">CRITICAL ANOMALY DETECTED</h4>
                       <p className="text-sm text-red-200 uppercase tracking-widest font-mono">STABILIZE FRAGMENT FREQUENCY</p>
                    </div>
                    <button 
                      onClick={() => {
                         playSound(UI_CLICK);
                         dispatchGameAction('findings-handshake-start');
                      }}
                      className="px-6 py-3 bg-white text-red-600 font-black rounded hover:bg-red-50 transition-all uppercase tracking-tighter"
                    >
                      START SYNC
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="w-full max-w-4xl space-y-8 relative z-20">
              <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-4">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Zap className="w-5 h-5" /> Power Relay Grid
                </h3>
                <button 
                  onClick={upgradeRelay}
                  disabled={(gameState?.points || 0) < 500}
                  className="bg-[#00ff41] text-black px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest hover:bg-[#00ff41]/80 disabled:opacity-30 transition-all"
                >
                  Expand Grid (500 CR)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div 
                    className="grid gap-1 p-2 border border-[#00ff41]/20 bg-black rounded"
                    style={{ 
                      gridTemplateColumns: `repeat(${gameState?.gridSize || 3}, 1fr)`,
                      width: 'fit-content'
                    }}
                  >
                    {Array((gameState?.gridSize || 3) ** 2).fill(0).map((_, i) => {
                      const x = i % (gameState?.gridSize || 3);
                      const y = Math.floor(i / (gameState?.gridSize || 3));
                      const module = gameState?.modules?.find((m: any) => x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h);
                      
                      return (
                        <div 
                          key={i}
                          onClick={() => module && handleModuleClick(module)}
                          className={cn(
                            "w-12 h-12 border flex items-center justify-center text-[8px] relative group cursor-pointer transition-colors",
                            module && (module.corrupted || module.type === 'static_rot') ? "border-red-500/50 bg-red-900/20 text-red-400" :
                            module && module.type === 'parasite' && module.hidden ? "border-[#00ff41]/10 hover:bg-[#00ff41]/5 text-[#00ff41]/20" :
                            module && module.overclocked ? "border-yellow-500/50 bg-yellow-900/20 text-yellow-400" :
                            module ? "bg-[#00ff41]/20 border-[#00ff41]/40 text-[#00ff41]" : "border-[#00ff41]/10 hover:bg-[#00ff41]/5"
                          )}
                        >
                          {module && x === module.x && y === module.y && (
                            <span className={cn(module.corrupted && "animate-pulse")}>
                               {module.type === 'static_rot' ? 'ERR' : module.type === 'parasite' && module.hidden ? (Math.random() > 0.9 ? '?' : '') : module.type[0].toUpperCase()}
                            </span>
                          )}

                          {module && x === module.x && y === module.y && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black border border-[#00ff41]/50 p-2 z-50 text-[10px] shadow-lg pointer-events-none">
                               <div className={cn("font-bold border-b pb-1 mb-1 uppercase tracking-tighter", module.corrupted ? "border-red-500/30 text-red-400" : "border-[#00ff41]/30 text-[#00ff41]")}>
                                  {module.isPrototype ? module.name : (module.corrupted ? "CORRUPTED " : "") + (MODULE_DATABASE[module.type as keyof typeof MODULE_DATABASE]?.name || module.type).toUpperCase()}
                               </div>
                               {!(module.corrupted || module.isPrototype || ['static_rot', 'parasite'].includes(module.type)) && (
                                 <div className="text-gray-400 mb-1">Click to {module.overclocked ? 'UNDERCLOCK' : 'OVERCLOCK'}<br/>(3x Power Drain/Effect)</div>
                               )}
                               {(module.corrupted || ['static_rot', 'parasite'].includes(module.type)) && (
                                 <div className="text-red-400 font-bold animate-pulse mb-1">Click to PURGE (-30 Power)</div>
                               )}
                               <div className="space-y-1">
                                  <div className="flex justify-between text-yellow-500/80">
                                     <span>DRAIN:</span>
                                     <span>{module.powerDrain ? (module.powerDrain * (module.overclocked ? 3 : module.corrupted ? 1.5 : 1)).toFixed(2) : 0}/s</span>
                                  </div>
                                  {module.isPrototype && (
                                     <div className="flex justify-between text-[#00ff41]">
                                        <span>EFFECT:</span>
                                        <span>+{module.effect?.toFixed(0)}%</span>
                                     </div>
                                  )}
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-[#00ff41]/40 uppercase tracking-widest">
                    Current Grid: {gameState?.gridSize}x{gameState?.gridSize}
                  </div>
                </div>

                <div className="space-y-4 h-96 overflow-y-auto pr-2 custom-scrollbar">
                  <h4 className="text-xs font-black uppercase tracking-widest">Available Modules</h4>
                  
                  {moduleDb ? (
                    <div className="space-y-6">
                      <div>
                        <h5 className="text-[10px] font-bold text-yellow-500/80 mb-2 border-b border-yellow-500/30 pb-1">QUICK FIXES (CONSUMABLES)</h5>
                        <div className="grid gap-2">
                          {Object.values(moduleDb).filter((m: any) => m.type === 'consumable').map((mod: any) => (
                            <ModuleItem key={mod.id} name={mod.name} cost={mod.cost} desc={mod.id === 'sedatives' ? '-15 Paranoia' : mod.id === 'hull_plating' ? '+20 Integrity' : '+25 Power'} onInstall={() => installModule(mod.id)} disabled={gameState?.points < mod.cost} />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-[10px] font-bold text-[#00ff41]/80 mb-2 border-b border-[#00ff41]/30 pb-1">FACILITY (SHARED)</h5>
                        <div className="grid gap-2">
                          {Object.values(moduleDb).filter((m: any) => m.type === 'permanent' && m.role === 'shared' && !m.hidden && m.id !== 'static_rot').map((mod: any) => (
                            <ModuleItem key={mod.id} name={mod.name} cost={mod.cost} desc={`Size: ${mod.w}x${mod.h} | Drain: ${mod.powerDrain}/s`} onInstall={() => installModule(mod.id)} disabled={gameState?.points < mod.cost} />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-[10px] font-bold text-blue-500/80 mb-2 border-b border-blue-500/30 pb-1">{role?.toUpperCase()} EXCLUSIVE</h5>
                        <div className="grid gap-2">
                          {Object.values(moduleDb).filter((m: any) => m.type === 'permanent' && m.role === role).map((mod: any) => (
                            <ModuleItem key={mod.id} name={mod.name} cost={mod.cost} desc={`Size: ${mod.w}x${mod.h} | Drain: ${mod.powerDrain}/s`} onInstall={() => installModule(mod.id)} disabled={gameState?.points < mod.cost} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] animate-pulse text-[#00ff41]/50">SYNCING MODULE DATABASE...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* System Console & Logs */}
        <div className="lg:col-span-4 border-l border-[#00ff41]/20 flex flex-col bg-black/80 backdrop-blur-2xl z-30">
          <div className="p-8 border-b border-[#00ff41]/20">
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="w-5 h-5 text-[#00ff41]/40" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Lab Terminal</span>
            </div>
            
            <div className="space-y-3 h-96 overflow-y-auto pr-4 custom-scrollbar">
              {gameState?.logs?.filter((log: string) => {
                if (log.startsWith('[SPECIALIST]') && role !== 'specialist') return false;
                if (log.startsWith('[ANALYST]') && role !== 'analyst') return false;
                return true;
              }).map((log: string, i: number) => {
                const displayLog = log.replace('[SPECIALIST] ', '').replace('[ANALYST] ', '');
                const isLore = displayLog.startsWith('[AUTOMATED') || displayLog.startsWith('[DECRYPTED');
                return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 text-[10px] font-bold"
                >
                  <span className="text-[#00ff41]/20">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className={cn(
                    displayLog.includes("!") || displayLog.includes("WARNING") || displayLog.includes("CRITICAL") ? "text-red-500 animate-pulse" : 
                    displayLog.includes("SOLD") ? "text-emerald-400" : 
                    isLore ? "text-purple-400 italic tracking-widest drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" :
                    paranoiaLevel > 70 && Math.random() > 0.9 ? "blur-[1px] skew-x-12" :
                    "text-[#00ff41]/60"
                  )}>{displayLog}</span>
                </motion.div>
              )})}
            </div>
          </div>

          <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00ff41]/40">Telemetry Data</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Signal Strength" value={`${gameState?.integrity || 0}%`} />
                <StatBox label="Noise Level" value={`${(100 - (gameState?.integrity || 0)) / 2}%`} />
                <StatBox label="Lab Temp" value={isDark ? "-12°C" : "-4°C"} />
                <StatBox label="Weather" value={gameState?.weather?.toUpperCase() || "CLEAR"} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00ff41]/40 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Shared Logbook
              </h4>
              <textarea 
                value={gameState?.sharedNotes || ""}
                onChange={(e) => dispatchGameAction('update-notes', { notes: e.target.value })}
                placeholder="Leave notes for the other operator here..."
                className="w-full h-32 bg-[#00ff41]/5 border border-[#00ff41]/20 rounded p-3 text-[10px] text-[#00ff41] focus:outline-none focus:border-[#00ff41]/50 resize-none custom-scrollbar"
              />
            </div>

            <div className="p-6 rounded border border-[#00ff41]/20 bg-[#00ff41]/5 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00ff41]/60" />
                <span className="text-[10px] font-black uppercase tracking-widest">Shift Protocol</span>
              </div>
              <p className="text-[10px] text-[#00ff41]/40 leading-relaxed uppercase">
                Maintain relay operation. Conserve power. 
                {paranoiaLevel > 50 && <span className="text-red-500 block mt-2 animate-pulse">DO NOT LOOK AT THE WINDOWS.</span>}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Audio Element removed for Web Audio API */}

      {/* Meta-Horror Overlays */}
      <AnimatePresence>
        {glitchFrameUrl && (
          <motion.div 
            initial={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] mix-blend-add pointer-events-none"
          >
            <img src={glitchFrameUrl} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-[#00ff41]/20 mix-blend-color animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {doppelgangerUrl && role === 'specialist' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2500] bg-black/90 flex flex-col items-center justify-center p-8 pointer-events-none"
          >
            <img src={doppelgangerUrl} className="max-w-xl w-full border border-red-500 animate-pulse mix-blend-screen" />
            <div className="mt-8 text-4xl font-black text-red-500 tracking-widest text-center animate-glitch">
              WHO IS SITTING NEXT TO YOU?
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subliminal Flash */}
      {subliminalFlash && (
        <div className="fixed inset-0 z-[2000] bg-white mix-blend-difference pointer-events-none flex items-center justify-center">
          <div className="text-black text-9xl font-black tracking-tighter scale-150 opacity-50">
            {Math.random() > 0.5 ? "IT HURTS" : "LET IT IN"}
          </div>
        </div>
      )}

      {/* Fake Disconnect Overlay */}
      <AnimatePresence>
        {fakeDisconnect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black text-[#00ff41] font-mono p-8 flex flex-col"
          >
            <div className="crt-overlay" />
            <div className="scanline" />
            <div className="text-sm space-y-2">
              <p>FATAL ERROR: SOCKET_CONNECTION_LOST</p>
              <p>ERR_CODE: 0x00000000</p>
              <p className="animate-pulse">ATTEMPTING TO RECONNECT...</p>
              <br />
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-red-500 mt-8"
              >
                <p>He can't hear you right now.</p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}>Why do you keep helping him?</motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6 }}>It's cold outside.</motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reboot Overlay */}
      <AnimatePresence>
        {gameState?.rebootState?.active && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-8"
          >
            <div className="crt-overlay" />
            <div className="crt-vignette" />
            <div className="crt-reflection" />
            <div className="crt-curve" />
            <div className="scanline" />
            
            <div className="max-w-2xl w-full space-y-12 text-center">
              <div className="space-y-4">
                <AlertCircle className="w-24 h-24 text-red-500 mx-auto animate-pulse" />
                <h1 className="text-6xl font-black text-red-500 tracking-tighter uppercase">CRITICAL FAILURE</h1>
                <p className="text-red-500/60 tracking-[0.5em] uppercase text-sm">Main Power Depleted. Manual Reboot Required.</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4 border border-red-500/30 p-8 bg-red-500/5">
                  <h3 className="text-red-500 font-black uppercase tracking-widest">Specialist Sequence</h3>
                  <div className="flex justify-center gap-4">
                    {[1, 2, 3].map(step => (
                      <div 
                        key={step}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black",
                          gameState.rebootState.specialistStep >= step 
                            ? "bg-red-500 border-red-500 text-black" 
                            : "border-red-500/30 text-red-500/30"
                        )}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                  {role === 'specialist' && gameState.rebootState.specialistStep < 3 && (
                    <button 
                      onClick={() => {
                        playSound(UI_CLICK);
                        dispatchGameAction('reboot-step', { role: 'specialist', step: gameState.rebootState.specialistStep + 1 });
                      }}
                      className="mt-6 bg-red-500 text-black px-6 py-3 rounded font-black uppercase tracking-widest hover:bg-red-400 active:scale-95 transition-all w-full"
                    >
                      Execute Step {gameState.rebootState.specialistStep + 1}
                    </button>
                  )}
                  {gameState.rebootState.specialistStep === 3 && (
                    <div className="mt-6 text-red-500 font-black uppercase tracking-widest animate-pulse">
                      READY
                    </div>
                  )}
                </div>

                <div className="space-y-4 border border-red-500/30 p-8 bg-red-500/5">
                  <h3 className="text-red-500 font-black uppercase tracking-widest">Analyst Sequence</h3>
                  <div className="flex justify-center gap-4">
                    {[1, 2, 3].map(step => (
                      <div 
                        key={step}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black",
                          gameState.rebootState.analystStep >= step 
                            ? "bg-red-500 border-red-500 text-black" 
                            : "border-red-500/30 text-red-500/30"
                        )}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                  {role === 'analyst' && gameState.rebootState.analystStep < 3 && (
                    <button 
                      onClick={() => {
                        playSound(UI_CLICK);
                        dispatchGameAction('reboot-step', { role: 'analyst', step: gameState.rebootState.analystStep + 1 });
                      }}
                      className="mt-6 bg-red-500 text-black px-6 py-3 rounded font-black uppercase tracking-widest hover:bg-red-400 active:scale-95 transition-all w-full"
                    >
                      Execute Step {gameState.rebootState.analystStep + 1}
                    </button>
                  )}
                  {gameState.rebootState.analystStep === 3 && (
                    <div className="mt-6 text-red-500 font-black uppercase tracking-widest animate-pulse">
                      READY
                    </div>
                  )}
                </div>
              </div>
              <p className="text-red-500/40 text-[10px] uppercase tracking-widest">Both operators must complete their sequence to restore power.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WatcherEyeOverlay active={showWatcherEye} />

      {abyssalHallucination && (
        <div className="fixed inset-0 z-[6000] pointer-events-none overflow-hidden">
          {abyssalHallucination.label === "Power" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 text-[8rem] font-black text-red-500/30 uppercase"
            >
              {abyssalHallucination.text}
            </motion.div>
          )}
          {abyssalHallucination.label === "Integrity" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 text-[6rem] font-black text-red-500/30 uppercase"
            >
              {abyssalHallucination.text}
            </motion.div>
          )}
          {abyssalHallucination.label === "Day" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 text-[4rem] font-black text-red-500/30 uppercase"
            >
              {abyssalHallucination.text}
            </motion.div>
          )}
        </div>
      )}
      
      <AnimatePresence>
        {abyssalMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 0.8, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center pointer-events-none"
          >
            <div className="text-[12rem] font-black text-white/5 uppercase tracking-tighter animate-pulse">
              {abyssalMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {distortPartner && (
        <div className="fixed inset-0 z-[4000] pointer-events-none mix-blend-difference bg-red-900/10 animate-glitch" />
      )}
    </div>
  );
}

function Meter({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex flex-col gap-1 w-24">
      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
        <span className="text-white/40">{label}</span>
        <span className={color}>{Math.floor(value)}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className={cn("h-full", color.replace('text-', 'bg-'))}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SystemToggle({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
  return (
    <button 
      onClick={() => {
        playSound(UI_CLICK);
        onClick();
      }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded border text-[8px] font-black uppercase tracking-widest transition-all",
        active ? "border-[#00ff41]/40 bg-[#00ff41]/20 text-[#00ff41]" : "border-white/10 text-white/20"
      )}
    >
      {icon || <Power className="w-3 h-3" />}
      {label}
    </button>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 rounded border border-[#00ff41]/10 bg-[#00ff41]/5 space-y-1">
      <div className="text-[8px] font-black uppercase text-[#00ff41]/30 tracking-widest">{label}</div>
      <div className="text-xs font-bold text-[#00ff41]/80">{value}</div>
    </div>
  );
}

function RoleCard({ title, icon, description, onClick, disabled }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative p-10 rounded-lg border-2 transition-all text-left space-y-6 overflow-hidden bg-black/80 backdrop-blur-xl",
        disabled 
          ? "border-[#00ff41]/5 opacity-30 cursor-not-allowed" 
          : "border-[#00ff41]/20 hover:border-[#00ff41]/60 hover:bg-[#00ff41]/5"
      )}
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="w-20 h-20 rounded bg-[#00ff41]/5 border border-[#00ff41]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-[#00ff41]">{title}</h3>
        <p className="text-xs text-[#00ff41]/40 leading-relaxed uppercase tracking-wider">{description}</p>
      </div>
      {!disabled && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#00ff41]/60">
          Initialize Shift <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
      {disabled && (
        <div className="text-[10px] font-black uppercase tracking-widest text-red-500/60 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" /> Position Occupied
        </div>
      )}
    </button>
  );
}

function ModuleItem({ name, desc, cost, onInstall, disabled }: any) {
  return (
    <div className="p-4 border border-[#00ff41]/20 bg-[#00ff41]/5 rounded flex items-center justify-between group">
      <div>
        <div className="text-[10px] font-black uppercase text-[#00ff41]">{name}</div>
        <div className="text-[8px] text-[#00ff41]/40 uppercase">{desc}</div>
      </div>
      <button 
        onClick={() => {
          playSound(UI_CLICK);
          onInstall();
        }}
        disabled={disabled}
        className="bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-[#00ff41]/20 disabled:opacity-20 transition-all"
      >
        {cost} CR
      </button>
    </div>
  );
}

function WindowView({ paranoia, isDark }: { paranoia: number, isDark: boolean }) {
  return (
    <div className="relative w-full h-[400px] border-2 border-[#00ff41]/20 rounded-lg overflow-hidden bg-black shadow-[inset_0_0_100px_rgba(0,0,0,1)]">
      {/* Mountain Landscape */}
      <div className={cn(
        "absolute inset-0 transition-all duration-1000",
        isDark ? "brightness-[0.05] contrast-150" : "brightness-50"
      )}>
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-white/10 to-transparent skew-y-[-5deg] translate-y-10" />
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-white/5 to-transparent skew-y-[8deg] translate-y-5" />
      </div>

      {/* Snow Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array(20).fill(0).map((_, i) => (
          <motion.div 
            key={i}
            initial={{ y: -10, x: Math.random() * 100 + '%' }}
            animate={{ 
              y: 410,
              x: (Math.random() * 100 - 10) + '%'
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2 + Math.random() * 3,
              delay: Math.random() * 5
            }}
            className="w-0.5 h-0.5 bg-white/20 rounded-full"
          />
        ))}
      </div>

      {/* Paranoia Entities */}
      {paranoia > 60 && (
        <motion.div 
          animate={{ 
            opacity: [0, 0.2, 0],
            x: [0, 10, 0]
          }}
          transition={{ repeat: Infinity, duration: 10 }}
          className="absolute top-1/2 left-1/4 w-4 h-12 bg-black blur-md"
        />
      )}

      {/* Glass Reflections */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none" />
      <div className="absolute inset-0 border-[20px] border-black/80 pointer-events-none" />
    </div>
  );
}

