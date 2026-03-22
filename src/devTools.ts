/**
 * DevTools — Browser Console Debug Commands for Void Signal Lab
 *
 * Access via: window.__VSL_DEBUG.setParanoia(99)
 * Only active in development builds.
 */

type StateGetter = () => any;
type StateSetter = (fn: (prev: any) => any) => void;
type ActionDispatcher = (action: string, payload?: any) => void;

export interface VSLDebugAPI {
  setParanoia: (n: number) => void;
  addCredits: (n: number) => void;
  setPower: (n: number) => void;
  setIntegrity: (n: number) => void;
  spawnSignal: () => void;
  triggerEvent: (eventId: string) => void;
  dumpState: () => void;
  godMode: () => void;
  skipToDay: (day: number) => void;
  forceBlizzard: () => void;
  forceClear: () => void;
  expandGrid: (size: number) => void;
  help: () => void;
}

export function initDevTools(
  getState: StateGetter,
  setState: StateSetter,
  dispatchAction: ActionDispatcher
) {
  const api: VSLDebugAPI = {
    setParanoia(n: number) {
      setState((prev: any) => ({ ...prev, paranoia: Math.max(0, Math.min(100, n)) }));
      console.log(`%c[VSL] Paranoia → ${n}`, 'color: #ff4444; font-weight: bold;');
    },

    addCredits(n: number) {
      setState((prev: any) => ({ ...prev, points: (prev.points || 0) + n }));
      console.log(`%c[VSL] Credits +${n}`, 'color: #00ff41; font-weight: bold;');
    },

    setPower(n: number) {
      setState((prev: any) => ({ ...prev, power: Math.max(0, Math.min(prev.maxPower || 100, n)) }));
      console.log(`%c[VSL] Power → ${n}`, 'color: #ffaa00; font-weight: bold;');
    },

    setIntegrity(n: number) {
      setState((prev: any) => ({ ...prev, integrity: Math.max(0, Math.min(100, n)) }));
      console.log(`%c[VSL] Integrity → ${n}`, 'color: #44aaff; font-weight: bold;');
    },

    spawnSignal() {
      dispatchAction('scan-sky', { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) });
      console.log(`%c[VSL] Forced signal scan`, 'color: #00ff41; font-weight: bold;');
    },

    triggerEvent(eventId: string) {
      dispatchAction('admin-trigger-event', { eventId });
      console.log(`%c[VSL] Triggered: ${eventId}`, 'color: #ff4444; font-weight: bold;');
    },

    dumpState() {
      const state = getState();
      console.group('%c[VSL] Game State Dump', 'color: #00ff41; font-weight: bold; font-size: 14px;');
      console.log('Day:', state?.day, '| Time:', state?.time);
      console.log('Power:', state?.power?.toFixed(1), '| Integrity:', state?.integrity?.toFixed(1));
      console.log('Paranoia:', state?.paranoia?.toFixed(1), '| Credits:', state?.points);
      console.log('Signals:', state?.signals?.length, '| Modules:', state?.modules?.length);
      console.log('Weather:', state?.weather, '| Antenna Frozen:', state?.antennaFrozen);
      console.log('Systems:', state?.systems);
      console.log('Reboot Active:', state?.rebootState?.active);
      console.table(state?.modules);
      console.groupEnd();
    },

    godMode() {
      setState((prev: any) => ({
        ...prev,
        power: 100,
        maxPower: 100,
        integrity: 100,
        paranoia: 0,
        points: 99999,
      }));
      console.log('%c[VSL] 🔱 GOD MODE ACTIVATED', 'color: gold; font-weight: bold; font-size: 16px; text-shadow: 0 0 10px gold;');
    },

    skipToDay(day: number) {
      setState((prev: any) => ({ ...prev, day, time: 480 }));
      console.log(`%c[VSL] Skipped to Day ${day}`, 'color: #00ff41; font-weight: bold;');
    },

    forceBlizzard() {
      setState((prev: any) => ({ ...prev, weather: 'blizzard' }));
      console.log(`%c[VSL] ❄️ Blizzard activated`, 'color: #88ccff; font-weight: bold;');
    },

    forceClear() {
      setState((prev: any) => ({ ...prev, weather: 'clear', antennaFrozen: false, systems: { ...prev.systems, scanning: true } }));
      console.log(`%c[VSL] ☀️ Weather cleared`, 'color: #ffdd44; font-weight: bold;');
    },

    expandGrid(size: number) {
      setState((prev: any) => ({ ...prev, gridSize: Math.max(3, Math.min(10, size)) }));
      console.log(`%c[VSL] Grid expanded to ${size}x${size}`, 'color: #00ff41; font-weight: bold;');
    },

    help() {
      console.log(`%c
╔═══════════════════════════════════════════════════╗
║          VOID SIGNAL LAB — DEBUG CONSOLE          ║
╠═══════════════════════════════════════════════════╣
║  __VSL_DEBUG.setParanoia(n)   Set paranoia 0-100  ║
║  __VSL_DEBUG.addCredits(n)    Add CR               ║
║  __VSL_DEBUG.setPower(n)      Set power %           ║
║  __VSL_DEBUG.setIntegrity(n)  Set integrity %       ║
║  __VSL_DEBUG.spawnSignal()    Force a sky scan      ║
║  __VSL_DEBUG.triggerEvent(id) Fire horror event     ║
║  __VSL_DEBUG.dumpState()      Print full state      ║
║  __VSL_DEBUG.godMode()        Infinite everything   ║
║  __VSL_DEBUG.skipToDay(n)     Jump to day N         ║
║  __VSL_DEBUG.forceBlizzard()  Activate blizzard     ║
║  __VSL_DEBUG.forceClear()     Clear weather          ║
║  __VSL_DEBUG.expandGrid(n)    Resize grid to NxN    ║
╚═══════════════════════════════════════════════════╝`, 'color: #00ff41; font-family: monospace;');
    }
  };

  (window as any).__VSL_DEBUG = api;

  // Show help automatically on init
  console.log('%c[VSL] DevTools loaded. Type __VSL_DEBUG.help() for commands.', 'color: #00ff41; font-weight: bold;');

  return api;
}
