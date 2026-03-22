import { createInitialGameState, applyGameAction, runHostGameTick, generateSignal, STRANGE_EVENTS } from '../hostEngine';
import { MODULE_DATABASE, handleModulePurchase } from '../gameEngine';

/**
 * GameTestHarness — Simulates a 2-player Void Signal Lab session
 * without Tauri, Steam, or any browser APIs.
 *
 * Usage:
 *   const h = new GameTestHarness();
 *   h.selectRoles();
 *   h.scanAndDownload();
 *   h.processAndSell(h.state.signals[0].id);
 *   expect(h.credits).toBeGreaterThan(0);
 */
export class GameTestHarness {
  state: any;
  hostRole: 'specialist' | 'analyst' = 'specialist';
  clientRole: 'specialist' | 'analyst' = 'analyst';
  logs: string[] = [];

  constructor() {
    this.state = createInitialGameState();
  }

  // --- Core Dispatchers ---

  /** Apply an action as the Host */
  hostAction(action: string, payload?: any) {
    this.state = applyGameAction(this.state, action, payload);
  }

  /** Apply an action as the Client (same engine in offline mode) */
  clientAction(action: string, payload?: any) {
    this.state = applyGameAction(this.state, action, payload);
  }

  /** Run N game ticks (each ~2s of real time) */
  tick(n = 1) {
    for (let i = 0; i < n; i++) {
      this.state = runHostGameTick(this.state);
    }
  }

  // --- High-Level Helpers ---

  /** Both players select their default roles */
  selectRoles(host: 'specialist' | 'analyst' = 'specialist', client: 'specialist' | 'analyst' = 'analyst') {
    this.hostRole = host;
    this.clientRole = client;
    this.hostAction('select-role', { role: host, steamId: 'HostPlayer' });
    this.clientAction('select-role', { role: client, steamId: 'ClientPlayer' });
  }

  /** Specialist scans the sky until a signal is found, then downloads it to 100% with resonance matching */
  scanAndDownload(): boolean {
    const origRandom = Math.random;

    // Force a signal discovery
    Math.random = () => 0.99;
    this.hostAction('scan-sky', { x: 5, y: 5, role: 'specialist' });
    Math.random = origRandom;

    if (!this.state.activeSignal) return false;

    // Match resonance before downloading
    this.hostAction('update-resonance', { 
      polarity: this.state.activeSignal.targetPolarity, 
      rotation: this.state.activeSignal.targetRotation 
    });

    // Download to completion (10 taps of 10%)
    while (this.state.activeSignal) {
      this.hostAction('download-progress', { role: 'specialist' });
    }
    return this.state.signals.length > 0;
  }

  /** Analyst processes a signal through decryption, then sells it */
  processAndSell(signalId: string): number {
    const before = this.state.points;

    // Process until status is 'processed' (each call adds 25%, needs 4)
    for (let i = 0; i < 4; i++) {
      this.clientAction('process-signal', { signalId, role: 'analyst' });
    }

    this.clientAction('sell-signal', { signalId, role: 'analyst' });
    return this.state.points - before;
  }

  /** Buy a module with auto-placement in the first empty grid cell */
  buyModule(moduleId: string, role: string = 'shared'): boolean {
    const mod = MODULE_DATABASE[moduleId];
    if (!mod) return false;

    // Find first empty cell that fits
    for (let y = 0; y < this.state.gridSize; y++) {
      for (let x = 0; x < this.state.gridSize; x++) {
        const res = handleModulePurchase(
          this.state, role, moduleId, x, y
        );
        if (res.success) return true;
      }
    }
    return false;
  }

  /** Force power to 0 to trigger reboot sequence */
  triggerPowerFailure() {
    this.state.power = 0;
    this.tick(1); // The tick will detect power <= 0 and activate reboot
  }

  /** Both players complete all reboot steps */
  completeReboot() {
    for (let step = 1; step <= 3; step++) {
      this.hostAction('reboot-step', { role: this.hostRole, step });
      this.clientAction('reboot-step', { role: this.clientRole, step });
    }
  }

  /** Directly set paranoia level for testing horror mechanics */
  setParanoia(level: number) {
    this.state.paranoia = Math.max(0, Math.min(100, level));
  }

  /** Directly set credits for testing economy */
  setCredits(amount: number) {
    this.state.points = amount;
  }

  // --- Quick Accessors ---

  get credits(): number { return this.state.points; }
  get power(): number { return this.state.power; }
  get paranoia(): number { return this.state.paranoia; }
  get integrity(): number { return this.state.integrity; }
  get day(): number { return this.state.day; }
  get modules(): any[] { return this.state.modules; }
  get signals(): any[] { return this.state.signals; }
  get isRebooting(): boolean { return this.state.rebootState.active; }
}
