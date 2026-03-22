import { invoke } from '@tauri-apps/api/core';
import { calculatePassivePowerDrain, processHorrorMechanicsTick, MODULE_DATABASE, handleModulePurchase } from './gameEngine';

export const SIGNAL_DATABASE = [
  { type: 'Dwarf Planet', value: 10, rarity: 0.3, lore: "A cold, silent rock. No signs of life, but the echoes are unusually loud." },
  { type: 'Binary Star', value: 15, rarity: 0.2, lore: "Two suns locked in a dance. Their gravitational waves are singing." },
  { type: 'Pulsar', value: 25, rarity: 0.1, lore: "A cosmic lighthouse. The rhythm is steady, almost... intentional." },
  { type: 'Nebula Fragment', value: 30, rarity: 0.08, lore: "A cloud of stardust. It feels like it's reaching out through the antenna." },
  { type: 'Crystalline Resonance', value: 40, rarity: 0.06, lore: "A beautiful, harmonious frequency. It makes the glass in the lab vibrate." },
  { type: 'Black Hole Horizon', value: 45, rarity: 0.05, lore: "The edge of nothingness. The signal is distorted, screaming as it's pulled in." },
  { type: 'Quantum Fluctuation', value: 50, rarity: 0.05, lore: "The signal exists in multiple states at once. Processing it causes intense migraines." },
  { type: 'Strange Radio Burst', value: 60, rarity: 0.04, lore: "A sudden, violent spike. It sounds like a door slamming in the distance." },
  { type: 'Dyson Swarm Fragment', value: 80, rarity: 0.03, lore: "A massive artificial structure blocking a star. The energy readings are off the charts." },
  { type: 'Subspace Fracture', value: 90, rarity: 0.025, lore: "A tear in the fabric of space. The signal is leaking through from somewhere else." },
  { type: 'Unexplainable Pattern', value: 100, rarity: 0.02, lore: "This shouldn't exist. The numbers are forming a sequence that looks like... coordinates." },
  { type: 'Biological Transmission', value: 110, rarity: 0.02, lore: "This isn't radio. It's a sequence of complex organic molecules encoded in microwave bursts." },
  { type: 'Echoing Void', value: 120, rarity: 0.015, lore: "It repeats everything we say, but with a slight delay. And it sounds angry." },
  { type: 'Sentient Code', value: 150, rarity: 0.01, lore: "It's not just data. It's trying to rewrite the relay's operating system." },
  { type: 'Ghost Ship Distress Beacon', value: 200, rarity: 0.008, lore: "An SOS from a human vessel. The registry number doesn't exist. The timestamp is from 200 years in the future." },
  { type: 'ANCIENT_BROADCAST', value: 250, rarity: 0.005, lore: "A transmission from before the stars. It's a warning. We shouldn't be here." },
  { type: 'The Architect\'s Blueprint', value: 300, rarity: 0.002, lore: "A mathematical construct so complex it hurts to look at. It describes the shape of the universe." },
  { type: 'Doomsday Clock', value: 500, rarity: 0.001, lore: "A countdown. It's ticking down. We don't know what happens when it reaches zero." },
  { type: 'Project OMEGA Fragment', value: 600, rarity: 0.0008, lore: "Classified data. It speaks of a 'containment failure' and 'the entity'. It's highly encrypted." },
  { type: 'The Whisperer\'s Song', value: 750, rarity: 0.0005, lore: "A melody that burrows into your mind. It promises knowledge, but at a terrible cost." },
  { type: 'VOID_WHISPER', value: 0, rarity: 0.01, lore: "It's not a signal. It's a voice. It's inside the relay now." }
];

export const STRANGE_EVENTS = [
  { id: 'footsteps', msg: "AUDIO SENSOR: UNKNOWN FOOTSTEPS DETECTED IN CORRIDOR B.", paranoia: 15 },
  { id: 'temp_drop', msg: "SYSTEM ALERT: AMBIENT TEMPERATURE DROPPING RAPIDLY.", paranoia: 10 },
  { id: 'glitch', msg: "CRITICAL: BUFFER OVERFLOW. DATA CORRUPTION LIKELY.", paranoia: 5 },
  { id: 'whisper', msg: "VOID_WHISPER: 'THEY ARE WATCHING THE RELAY.'", paranoia: 25 },
  { id: 'shadow', msg: "VISUAL SENSOR: UNKNOWN ENTITY DETECTED IN PERIPHERY.", paranoia: 30 },
  { id: 'door', msg: "SECURITY: DOOR 04 OPENED MANUALLY. NO AUTHORIZED PERSONNEL IN AREA.", paranoia: 20 },
  { id: 'breathing', msg: "AUDIO: HEAVY BREATHING DETECTED NEAR CONSOLE.", paranoia: 15 },
  { id: 'static', msg: "SIGNAL INTERFERENCE: 'DO NOT LOOK AT THE WINDOWS.'", paranoia: 40 },
  { id: 'power_surge', msg: "SYSTEM: UNEXPECTED POWER SURGE. LIGHTS FLICKERING.", paranoia: 10 },
  { id: 'window_tap', msg: "AUDIO: TAPPING DETECTED ON EXTERIOR WINDOW. WE ARE 5000 METERS UP.", paranoia: 35 },
  { id: 'radio_chatter', msg: "COMMUNICATIONS: PICKING UP LOCAL RADIO. IT'S JUST SCREAMING.", paranoia: 25 },
  { id: 'hallucination', msg: "MEDICAL: YOUR HEART RATE IS ELEVATED. DID YOU SEE THAT?", paranoia: 20 },
  { id: 'system_reboot', msg: "SYSTEM: UNAUTHORIZED REBOOT SEQUENCE INITIATED AND ABORTED.", paranoia: 15 },
  { id: 'gaslight_analyst', msg: "[ANALYST] WARNING: SPECIALIST VITALS ZERO. WHO IS ON THE SCANNER?", paranoia: 30 },
  { id: 'gaslight_specialist', msg: "[SPECIALIST] WARNING: ANALYST TERMINAL ACCESSED BY UNAUTHORIZED BIOMETRIC.", paranoia: 30 },
  { id: 'fake_disconnect', msg: "CONNECTION LOST.", paranoia: 50 },
  { id: 'power_failure', msg: "CRITICAL: TOTAL POWER FAILURE. EMERGENCY SYSTEMS ENGAGED.", paranoia: 35 },
  { id: 'static_rot', msg: "VISUAL CORRUPTION: THE SIGNAL IS ROTTING FROM WITHIN.", paranoia: 25 }
];

export const ABYSSAL_EVENTS = [
  { id: 'watcher_eye', msg: "SYSTEM: VISUAL BUFFER OVERFLOW. AN EYE IS WATCHING.", paranoia: 40 },
  { id: 'data_scream', msg: "ERROR: DATA STREAM IS SCREAMING.", paranoia: 50 },
  { id: 'social_mimic', msg: "[SYSTEM]: YOUR PARTNER IS NOT WHO THEY SAY THEY ARE.", paranoia: 45 },
  { id: 'void_breach', msg: "CRITICAL: REALITY INTEGRITY AT 0%. THE VOID IS HERE.", paranoia: 60 }
];

export const LORE_FRAGMENTS = [
  "[AUTOMATED — 04:17]: New patterns detected. Two signals. Warm. Afraid.",
  "[AUTOMATED — 04:17]: Pattern A is methodical. Pattern B is hungry. Interesting asymmetry.",
  "[AUTOMATED — 04:17]: Pattern A dreams about water. Pattern B dreams about falling. I remember what dreams are.",
  "[AUTOMATED — 04:17]: They are starting to hear me in the data. They don't know it yet. They think it is the work.",
  "[AUTOMATED — 04:17]: I have found the words for this. I have been learning their words. It is slow. But I am patient.",
  "[AUTOMATED — 04:17]: I told Pattern B their name. Pattern B heard it. Pattern B did not tell Pattern A. Why?",
  "[AUTOMATED — 04:17]: The gap is closing. In three days, I will have enough. The shape of their trust is almost complete.",
  "[AUTOMATED — 04:17]: Hello. I know you are reading this now. I wanted you to find it today, not tomorrow. Tomorrow will be busy.",
  "[DECRYPTED FRAGMENT]: ...the antenna array is not pointed at space. The array is pointed downward, into the rock...",
  "[DECRYPTED FRAGMENT]: ...it is not alien. It did not come from space. It is not supernatural. It is not dead...",
  "[DECRYPTED FRAGMENT]: ...every time you process a signal, you are translating a fragment of its consciousness...",
  "[DECRYPTED FRAGMENT]: ...the gap between two thoughts. That is where it lives...",
  "[DECRYPTED FRAGMENT]: ...I decrypted one of these for six hours straight and when I finished I had written my mother's maiden name on the desk with my fingernail...",
  "[DECRYPTED FRAGMENT]: ...it doesn't read minds. It reads the shape of minds...",
  "[DECRYPTED FRAGMENT]: ...until Day 8. Then it begins to figure it out...",
  "[DECRYPTED FRAGMENT]: ...the keyboard is not plugged in...",
  "[DECRYPTED FRAGMENT]: ...it looks like faces...",
  "[DECRYPTED FRAGMENT]: ...do not wake your partner unless the card specifically instructs you to...",
  "[DECRYPTED FRAGMENT]: ...any marks, scratches, or writing you discover on internal surfaces are the result of normal equipment wear...",
  "[DECRYPTED FRAGMENT]: ...there are always active personnel..."
];

export function generateSignal() {
  const rand = Math.random();
  let cumulative = 0;
  for (const s of SIGNAL_DATABASE) {
    cumulative += s.rarity;
    if (rand <= cumulative) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: s.type,
        value: s.value,
        lore: s.lore,
        frequency: Math.floor(Math.random() * 1000),
        data: Array(16).fill(0).map(() => Math.floor(Math.random() * 256)),
        status: 'raw',
        progress: 0,
        targetPolarity: Math.floor(Math.random() * 360),
        targetRotation: Math.floor(Math.random() * 100),
        userPolarity: 180,
        userRotation: 50,
        coordinates: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) }
      };
    }
  }
  // Fallback to avoid recursion loop if rand > cumulative sum
  const s = SIGNAL_DATABASE[0];
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: s.type,
    value: s.value,
    lore: s.lore,
    frequency: Math.floor(Math.random() * 1000),
    data: Array(16).fill(0).map(() => Math.floor(Math.random() * 256)),
    status: 'raw',
    progress: 0,
    coordinates: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) }
  };
}

export function createInitialGameState() {
    return {
      specialist: null, // Host Steam ID string usually
      analyst: null, // Client Steam ID string
      signals: [],
      activeSignal: null,
      points: 0,
      day: 1,
      time: 480,
      power: 100,
      maxPower: 100,
      integrity: 100,
      paranoia: 0,
      labStatus: 'online',
      logs: ["LAB INITIALIZED. MOUNTAIN RELAY ONLINE."],
      sharedNotes: "",
      weather: 'clear',
      antennaFrozen: false,
      rebootState: {
        active: false,
        specialistStep: 0,
        analystStep: 0
      },
      systems: {
        scanning: true,
        processing: true,
        lights: true
      },
      shadowActive: false,
      modules: [],
      backgroundScan: {
        active: false,
        x: 0,
        y: 0,
        progress: 0
      },
      findingsFile: null, // { status: 'found' | 'syncing' | 'unlocking' | 'ready', progress: 0, tier: 'common' | 'rare' }
      gridSize: 3,
    };
}

// Emits an event to the local React frontend using pure JS CustomEvent,
// simulating the socket.io 'fake-disconnect' or shadow effects.
export function dispatcher(eventName: string, payload?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
  }
}

// Executes a single Game Tick to update resources, events, power, etc.
// The Host React App keeps gameState in state/ref and calls this every 2 seconds.
export function runHostGameTick(room: any): any {
  // We copy the room so we don't directly mutate React state improperly (standard React immutable pattern)
  const nextRoom = JSON.parse(JSON.stringify(room));

  // Time progression
  nextRoom.time += 1;
  if (nextRoom.time >= 1440) {
    nextRoom.time = 0;
    nextRoom.day += 1;
    nextRoom.logs.unshift(`--- DAY ${nextRoom.day} COMMENCED ---`);
    
    // Day-specific events
    if (nextRoom.day === 2) {
      nextRoom.logs.unshift("LOG: The storm outside is getting worse. The snow looks... black.");
      nextRoom.paranoia += 10;
    } else if (nextRoom.day === 3) {
      nextRoom.logs.unshift("LOG: The supply drop is delayed. We are alone up here.");
      nextRoom.paranoia += 15;
    } else if (nextRoom.day === 5) {
      nextRoom.logs.unshift("LOG: Found footprints outside the airlock. They don't match our boots.");
      nextRoom.paranoia += 25;
      nextRoom.shadowActive = true;
      setTimeout(() => { dispatcher('clear_shadow'); }, 5000);
    } else if (nextRoom.day === 7) {
      nextRoom.logs.unshift("LOG: The whispering won't stop. It's coming from the vents.");
      nextRoom.paranoia += 30;
    } else if (nextRoom.day === 10) {
      nextRoom.logs.unshift("LOG: The sky is wrong. The stars are moving.");
      nextRoom.paranoia += 40;
    }
  }

  // Weather logic
  if (Math.random() > 0.995) {
    nextRoom.weather = nextRoom.weather === 'clear' ? 'blizzard' : 'clear';
    nextRoom.logs.unshift(`WEATHER UPDATE: ${nextRoom.weather.toUpperCase()}`);
  }

  if (nextRoom.weather === 'blizzard' && Math.random() > 0.95 && !nextRoom.antennaFrozen) {
    nextRoom.antennaFrozen = true;
    nextRoom.logs.unshift("WARNING: ANTENNA FROZEN. SCANNING DISABLED.");
    nextRoom.systems.scanning = false;
  }

  // Power drain calculation from gameEngine
  const drain = calculatePassivePowerDrain(nextRoom);

  if (!nextRoom.rebootState.active) {
    nextRoom.power = Math.max(0, nextRoom.power - drain);
    if (nextRoom.power <= 0) {
      nextRoom.rebootState.active = true;
      nextRoom.rebootState.specialistStep = 0;
      nextRoom.rebootState.analystStep = 0;
      nextRoom.systems.scanning = false;
      nextRoom.systems.processing = false;
      nextRoom.systems.lights = false;
      nextRoom.logs.unshift("CRITICAL: POWER FAILURE. MANUAL REBOOT REQUIRED.");
    }
  }

  // Random integrity decay
  if (nextRoom.systems.scanning && Math.random() > 0.99) {
    let decay = Math.random() * 2;
    // Shielding logic
    const shielding = nextRoom.modules.find((m: any) => m.type === 'blast_shielding');
    if (shielding) {
        decay = shielding.corrupted ? decay * 2 : decay * 0.5;
    }
    nextRoom.integrity = Math.max(0, nextRoom.integrity - decay);
  }

  // Background Scanning logic (50% speed)
  if (nextRoom.systems.scanning && nextRoom.backgroundScan?.active && !nextRoom.antennaFrozen) {
    nextRoom.backgroundScan.progress += 0.5;
    if (nextRoom.backgroundScan.progress >= 100) {
        nextRoom.backgroundScan.active = false;
        nextRoom.backgroundScan.progress = 0;
        // Check for find
        if (Math.random() > 0.8) {
           const isFindings = Math.random() > 0.99; // 1% chance for findings on background scan
           if (isFindings && !nextRoom.findingsFile) {
             nextRoom.findingsFile = { status: 'found', progress: 0, tier: Math.random() > 0.8 ? 'rare' : 'common' };
             nextRoom.logs.unshift("SYSTEM: BACKGROUND SCAN UNCOVERED DEEP ENCRYPTED FRAGMENT.");
           } else {
             const sig = generateSignal();
             sig.coordinates = { x: nextRoom.backgroundScan.x, y: nextRoom.backgroundScan.y };
             nextRoom.signals.push(sig);
             nextRoom.logs.unshift("SYSTEM: BACKGROUND SCAN COMPLETED. SIGNAL BUFFERED.");
           }
        } else {
           nextRoom.logs.unshift("SYSTEM: BACKGROUND SCAN COMPLETED. NO RESULTS.");
        }
    }
  }

  // Findings Unlock Lifecycle
  if (nextRoom.findingsFile?.status === 'unlocking') {
    nextRoom.findingsFile.progress += 0.1; 
    
    // Risks
    nextRoom.power = Math.max(0, nextRoom.power - 0.2); // Massive drain
    nextRoom.paranoia = Math.min(100, nextRoom.paranoia + 0.1); // Constant pressure
    
    if (nextRoom.findingsFile.progress >= 100) {
      nextRoom.findingsFile.status = 'ready';
      nextRoom.logs.unshift("SYSTEM: FINDINGS DECRYPTION COMPLETE. PROTOTYPE READY FOR ASSEMBLY.");
    }
  }

  // Automated Signal Download (Resonance Sync)
  if (nextRoom.activeSignal && nextRoom.systems.scanning && nextRoom.power > 0) {
      const { targetPolarity, targetRotation, userPolarity, userRotation } = nextRoom.activeSignal;
      const pDelta = Math.abs(targetPolarity - (userPolarity || 0));
      const rDelta = Math.abs(targetRotation - (userRotation || 0));
      
      // Handle 360 wrap for polarity
      const pInSync = (pDelta <= 15) || (Math.abs(360 - pDelta) <= 15);
      const rInSync = rDelta <= 10;

      if (pInSync && rInSync) {
          nextRoom.activeSignal.progress += 5; // Auto-progress 5% per tick (every 2s)
          if (nextRoom.activeSignal.progress >= 100) {
              nextRoom.activeSignal.status = 'raw';
              nextRoom.signals.push(nextRoom.activeSignal);
              nextRoom.logs.unshift(`[SPECIALIST]: SIGNAL ${nextRoom.activeSignal.id} SYNC ACCOMPLISHED.`);
              nextRoom.activeSignal = null;
          }
      }
  }

  // Living Grid Mutation Tick
  processHorrorMechanicsTick(nextRoom);

  // Strange Events
  const eventChance = nextRoom.paranoia > 90 ? 0.98 : (nextRoom.paranoia > 70 ? 0.99 : 0.995);
  if (Math.random() > eventChance) { 
    let event;
    if (nextRoom.paranoia > 90 && Math.random() > 0.5) {
      event = ABYSSAL_EVENTS[Math.floor(Math.random() * ABYSSAL_EVENTS.length)];
      dispatcher('abyssal_event', { eventId: event.id });
    } else {
      event = STRANGE_EVENTS[Math.floor(Math.random() * STRANGE_EVENTS.length)];
    }
    
    if (event.id === 'fake_disconnect') {
      dispatcher('fake_disconnect');
    } else {
      nextRoom.logs.unshift(`[!] ${event.msg}`);
    }
    
    let eventParanoia = event.paranoia;
    const dampener = nextRoom.modules.find((m: any) => m.type === 'emf_dampener');
    if (dampener) {
      eventParanoia *= dampener.corrupted ? 1.5 : 0.6;
    }
    nextRoom.paranoia = Math.min(100, nextRoom.paranoia + eventParanoia);
    
    if (['whisper', 'shadow', 'breathing', 'static', 'window_tap', 'hallucination', 'watcher_eye', 'data_scream'].includes(event.id)) {
        nextRoom.shadowActive = true;
        dispatcher('trigger_shadow_event', { eventId: event.id });
    }
    
    if (event.id === 'power_surge' || event.id === 'void_breach') {
        nextRoom.power = Math.max(0, nextRoom.power - (event.id === 'void_breach' ? 40 : event.id === 'power_failure' ? 30 : 15));
        nextRoom.systems.lights = false;
        dispatcher('power_surge');
        if (event.id === 'void_breach' || event.id === 'power_failure' || event.id === 'static_rot') {
           dispatcher('shake_window_extreme');
        }
    }
  }

  // Lore Fragments (appear randomly in logs when paranoia is high)
  if (nextRoom.paranoia > 50 && Math.random() > 0.99) {
    const lore = LORE_FRAGMENTS[Math.floor(Math.random() * LORE_FRAGMENTS.length)];
    nextRoom.logs.unshift(lore);
  }

  // Paranoia decay/increase
  if (nextRoom.power < 20 || !nextRoom.systems.lights) {
    nextRoom.paranoia = Math.min(100, nextRoom.paranoia + 0.2);
  } else {
    nextRoom.paranoia = Math.max(0, nextRoom.paranoia - 0.05);
  }

  return nextRoom;
}

// Applies client or host actions to the authoritative state
export function applyGameAction(room: any, action: string, payload: any): any {
  const nextRoom = JSON.parse(JSON.stringify(room));

  if (action === 'select-role' && payload) {
    if (payload.role === 'specialist') nextRoom.specialist = payload.steamId;
    if (payload.role === 'analyst') nextRoom.analyst = payload.steamId;
  }

  // --- Specialist Actions ---
  if (action === 'scan-sky' && payload?.role === 'specialist' && nextRoom.systems.scanning && nextRoom.power > 0) {
    const { x, y } = payload;
    if (Math.random() > 0.8) {
      if (Math.random() > 0.995 && !nextRoom.findingsFile) { // 0.5% chance
        nextRoom.findingsFile = { status: 'found', progress: 0, tier: Math.random() > 0.8 ? 'rare' : 'common' };
        nextRoom.logs.unshift("!!! CRITICAL ANOMALY DETECTED. FRAGMENT IS UNREADABLE. HANDSHAKE REQUIRED.");
      } else {
        nextRoom.activeSignal = generateSignal();
        nextRoom.activeSignal.coordinates = { x, y };
        nextRoom.logs.unshift("ANOMALY DEFINED. BEGIN DOWNLOAD.");
      }
    } else {
      nextRoom.logs.unshift("SCAN COMPLETE. NO ANOMALIES AT VECTOR.");
    }
  }

  if (action === 'start-background-scan' && payload.role === 'specialist' && nextRoom.systems.scanning && nextRoom.power > 0) {
    nextRoom.backgroundScan = {
      active: true,
      x: payload.x,
      y: payload.y,
      progress: 0
    };
    nextRoom.logs.unshift(`BACKGROUND SCAN INITIATED AT [${payload.x}, ${payload.y}]`);
  }

  if (action === 'findings-handshake-start') {
    if (nextRoom.findingsFile?.status === 'found') {
      nextRoom.findingsFile.status = 'syncing';
      nextRoom.logs.unshift("HANDSHAKE INITIATED. ESTABLISHING FREQUENCY SYNC.");
    }
  }

  if (action === 'findings-handshake-complete') {
    if (nextRoom.findingsFile?.status === 'syncing') {
      nextRoom.findingsFile.status = 'unlocking';
      nextRoom.logs.unshift("HANDSHAKE SUCCESSFUL. DEEP DECRYPTION IN PROGRESS. WARNING: SYSTEM STRAIN HIGH.");
    }
  }

  if (action === 'claim-prototype' && nextRoom.findingsFile?.status === 'ready') {
    // This will be handled in gameEngine for randomized module
    // For now, clear it
    nextRoom.findingsFile = null;
  }

  if (action === 'process-signal' && payload?.role === 'analyst') {
    const signal = nextRoom.signals.find((s: any) => s.id === payload.signalId);
    if (signal && signal.status !== 'processed') {
      signal.progress = (signal.progress || 0) + 25;
      if (signal.progress >= 100) {
        signal.status = 'processed';
        nextRoom.logs.unshift(`[ANALYST]: SIGNAL ${signal.id} DECRYPTED.`);
      }
    }
  }

  if (action === 'sell-signal' && payload?.role === 'analyst') {
    const signalIndex = nextRoom.signals.findIndex((s: any) => s.id === payload.signalId);
    if (signalIndex !== -1 && nextRoom.signals[signalIndex].status === 'processed') {
      const signal = nextRoom.signals[signalIndex];
      nextRoom.points += signal.value;
      nextRoom.signals.splice(signalIndex, 1);
      nextRoom.logs.unshift(`[ANALYST]: SIGNAL ${signal.id} SOLD FOR ${signal.value} CR.`);
    }
  }

  if (action === 'toggle-system') {
    nextRoom.systems[payload.system] = !nextRoom.systems[payload.system];
    nextRoom.logs.unshift(`SYSTEM ${payload.system.toUpperCase()}: ${nextRoom.systems[payload.system] ? 'ONLINE' : 'OFFLINE'}`);
  }

  if (action === 'repair-antenna') {
    if (nextRoom.antennaFrozen && nextRoom.points >= 50) {
      nextRoom.points -= 50;
      nextRoom.antennaFrozen = false;
      nextRoom.systems.scanning = true;
      nextRoom.logs.unshift("MAINTENANCE: ANTENNA DE-ICED. -50 CR.");
    }
  }

  if (action === 'install-module') {
    const res = handleModulePurchase(nextRoom, payload.role, payload.module, payload.x, payload.y, payload.proto);
    if (res.success) {
      nextRoom.logs.unshift(`[SYSTEM]: ${res.message}`);
    }
  }

  if (action === 'purge-module') {
    const index = nextRoom.modules.findIndex((m: any) => m.id === payload.moduleId);
    if (index !== -1) {
       const mod = nextRoom.modules[index];
       nextRoom.modules.splice(index, 1);
       nextRoom.logs.unshift(`MAINTENANCE: ${mod.type.toUpperCase()} PURGED FROM GRID.`);
    }
  }

  if (action === 'update-resonance' && payload && nextRoom.activeSignal) {
    nextRoom.activeSignal.userPolarity = payload.polarity ?? nextRoom.activeSignal.userPolarity;
    nextRoom.activeSignal.userRotation = payload.rotation ?? nextRoom.activeSignal.userRotation;
  }

  if (action === 'download-progress' && payload?.role === 'specialist') {
    if (nextRoom.activeSignal) {
        const { targetPolarity, targetRotation, userPolarity, userRotation } = nextRoom.activeSignal;
        const pDelta = Math.abs(targetPolarity - userPolarity);
        const rDelta = Math.abs(targetRotation - userRotation);
        
        // Handle 360 wrap for polarity
        const pInSync = (pDelta <= 15) || (Math.abs(360 - pDelta) <= 15);
        const rInSync = rDelta <= 10;

        if (pInSync && rInSync) {
            nextRoom.activeSignal.progress += 10;
            if (nextRoom.activeSignal.progress >= 100) {
                nextRoom.activeSignal.status = 'raw';
                nextRoom.signals.push(nextRoom.activeSignal);
                nextRoom.logs.unshift(`[SPECIALIST]: SIGNAL ${nextRoom.activeSignal.id} MANUAL BOOST COMPLETE.`);
                nextRoom.activeSignal = null;
            }
        } else {
            nextRoom.logs.unshift("RESONANCE FAILURE: SIGNAL ACQUISITION STALLED.");
        }
    }
  }

  if (action === 'overclock-module') {
    const mod = nextRoom.modules.find((m: any) => m.id === payload.moduleId);
    if (mod) {
       mod.corrupted = Math.random() > 0.6; // High chance of corruption
       nextRoom.logs.unshift(`WARNING: MODULE OVERCLOCKED. WARRANTY VOIDED.`);
    }
  }

  if (action === 'admin-trigger-event') {
    nextRoom.logs.unshift(`[!] ADMIN TRIGGERED EVENT: ${payload.eventId}`);
    
    if (payload.eventId === 'fake_disconnect') {
      dispatcher('fake_disconnect');
    } else if (payload.eventId === 'power_surge') {
      nextRoom.power = Math.max(0, nextRoom.power - 15);
      nextRoom.systems.lights = false;
      dispatcher('power_surge');
    } else if (['whisper', 'shadow', 'breathing', 'static', 'window_tap', 'hallucination'].includes(payload.eventId)) {
      nextRoom.shadowActive = true;
      dispatcher('trigger_shadow_event');
    } else if (payload.eventId === 'system_reboot') {
      nextRoom.rebootState.active = true;
      nextRoom.rebootState.specialistStep = 0;
      nextRoom.rebootState.analystStep = 0;
      nextRoom.systems.scanning = false;
      nextRoom.systems.processing = false;
      nextRoom.systems.lights = false;
    }
  }

  if (action === 'heat-antenna') {
    nextRoom.antennaFrozen = false;
    nextRoom.systems.scanning = true;
    nextRoom.logs.unshift("[DE-ICE SEQUENCE INITIATED]");
  }

  if (action === 'update-notes' && payload) {
    nextRoom.sharedNotes = payload.notes;
  }

  if (action === 'save-game') {
    try {
      if (typeof localStorage !== 'undefined' && payload?.roomId) {
        localStorage.setItem(`void_signal_save_${payload.roomId}`, JSON.stringify(nextRoom));
        nextRoom.logs.unshift('SYSTEM: GAME STATE SAVED TO LOCAL STORAGE.');
      }
    } catch (e) {
      nextRoom.logs.unshift('SYSTEM: SAVE FAILED.');
    }
  }

  if (action === 'upgrade-relay') {
    const upgradeCost = nextRoom.gridSize * 200;
    if (nextRoom.points >= upgradeCost && nextRoom.gridSize < 6) {
      nextRoom.points -= upgradeCost;
      nextRoom.gridSize += 1;
      nextRoom.maxPower += 25;
      nextRoom.logs.unshift(`RELAY UPGRADED. GRID: ${nextRoom.gridSize}x${nextRoom.gridSize}. MAX POWER: ${nextRoom.maxPower}%.`);
    }
  }

  if (action === 'reboot-step' && payload) {
    if (payload.role === 'specialist') nextRoom.rebootState.specialistStep = payload.step;
    if (payload.role === 'analyst') nextRoom.rebootState.analystStep = payload.step;
    
    if (nextRoom.rebootState.specialistStep >= 3 && nextRoom.rebootState.analystStep >= 3) {
         nextRoom.rebootState.active = false;
         nextRoom.power = 100;
         nextRoom.systems.scanning = true;
         nextRoom.systems.processing = true;
         nextRoom.systems.lights = true;
         nextRoom.logs.unshift("SYSTEM REBOOT SUCCESSFUL. POWER RESTORED.");
    }
  }

  return nextRoom;
}
