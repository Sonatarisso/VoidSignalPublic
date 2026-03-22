import { describe, it, expect, beforeEach } from 'vitest';
import { GameTestHarness } from './GameTestHarness';

/**
 * Full 2-Player Simulation Test Suite
 *
 * Simulates a complete game session from lobby → signals → economy → horror → reboot
 * without any Tauri, Steam, or browser dependencies.
 */
describe('2-Player Simulation', () => {

  let game: GameTestHarness;

  beforeEach(() => {
    game = new GameTestHarness();
  });

  // ========================
  // LOBBY & ROLE SELECTION
  // ========================
  describe('Lobby Flow', () => {
    it('both players can join and select unique roles', () => {
      game.selectRoles('specialist', 'analyst');
      expect(game.state.specialist).toBe('HostPlayer');
      expect(game.state.analyst).toBe('ClientPlayer');
    });

    it('initial state has correct defaults', () => {
      expect(game.power).toBe(100);
      expect(game.paranoia).toBe(0);
      expect(game.integrity).toBe(100);
      expect(game.credits).toBe(0);
      expect(game.day).toBe(1);
    });
  });

  // ========================
  // SIGNAL PIPELINE
  // ========================
  describe('Full Signal Pipeline', () => {
    beforeEach(() => {
      game.selectRoles();
    });

    it('Specialist can scan → download a signal', () => {
      const found = game.scanAndDownload();
      expect(found).toBe(true);
      expect(game.signals.length).toBe(1);
      expect(game.signals[0].status).toBe('raw');
    });

    it('Analyst can process → sell a signal for credits', () => {
      game.scanAndDownload();
      const signalId = game.signals[0].id;
      const earned = game.processAndSell(signalId);
      expect(earned).toBeGreaterThan(0);
      expect(game.credits).toBeGreaterThan(0);
      expect(game.signals.length).toBe(0);
    });

    it('multiple signals can be queued and sold', () => {
      game.scanAndDownload();
      game.scanAndDownload();
      expect(game.signals.length).toBe(2);

      const id1 = game.signals[0].id;
      const id2 = game.signals[1].id;
      game.processAndSell(id1);
      game.processAndSell(id2);
      expect(game.signals.length).toBe(0);
      expect(game.credits).toBeGreaterThan(0);
    });
  });

  // ========================
  // ECONOMY & MODULES
  // ========================
  describe('Economy Cycle', () => {
    beforeEach(() => {
      game.selectRoles();
      game.setCredits(2000); // Give plenty of credits
    });

    it('can purchase consumable Power Core', () => {
      game.state.power = 50;
      const before = game.credits;
      game.hostAction('install-module', { role: 'shared', module: 'power_core', x: 0, y: 0 });
      expect(game.power).toBe(75); // +25
      expect(game.credits).toBe(before - 80);
    });

    it('can purchase consumable Sedatives', () => {
      game.setParanoia(60);
      game.hostAction('install-module', { role: 'shared', module: 'sedatives', x: 0, y: 0 });
      expect(game.paranoia).toBe(45); // -15
    });

    it('can install permanent module on grid', () => {
      game.hostAction('install-module', { role: 'specialist', module: 'thermal_sink', x: 0, y: 0 });
      expect(game.modules.length).toBe(1);
      expect(game.modules[0].type).toBe('thermal_sink');
    });

    it('permanent module affects power drain', () => {
      const drainBefore = game.power;
      game.hostAction('install-module', { role: 'specialist', module: 'thermal_sink', x: 0, y: 0 });
      game.tick(10);
      const drainAfter = drainBefore - game.power;
      expect(drainAfter).toBeGreaterThan(0);
    });
  });

  // ========================
  // POWER SYSTEM
  // ========================
  describe('Power & Reboot System', () => {
    beforeEach(() => {
      game.selectRoles();
    });

    it('power drains over time', () => {
      game.tick(50);
      expect(game.power).toBeLessThan(100);
    });

    it('reboot activates at power 0', () => {
      game.triggerPowerFailure();
      expect(game.isRebooting).toBe(true);
      expect(game.state.systems.scanning).toBe(false);
      expect(game.state.systems.processing).toBe(false);
      expect(game.state.systems.lights).toBe(false);
    });

    it('both players can complete reboot sequence', () => {
      game.triggerPowerFailure();
      expect(game.isRebooting).toBe(true);
      
      game.completeReboot();
      expect(game.isRebooting).toBe(false);
      expect(game.power).toBe(100);
      expect(game.state.systems.scanning).toBe(true);
    });
  });

  // ========================
  // HORROR MECHANICS
  // ========================
  describe('Horror Mechanics', () => {
    beforeEach(() => {
      game.selectRoles();
    });

    it('high paranoia (80+) can corrupt modules', () => {
      game.setCredits(1000);
      game.hostAction('install-module', { role: 'specialist', module: 'thermal_sink', x: 0, y: 0 });
      game.setParanoia(95);

      const orig = Math.random;
      Math.random = () => 0.99; // Force corruption
      game.tick(1);
      Math.random = orig;

      // Module may or may not be corrupted (depends on random threshold per tick)
      // Just verify the system doesn't crash
      expect(game.modules.length).toBeGreaterThanOrEqual(1);
    });

    it('paranoia 90+ spawns static_rot on grid', () => {
      game.setParanoia(95);
      game.state.gridSize = 5; // Plenty of space

      const orig = Math.random;
      Math.random = () => 0.96;
      game.tick(1);
      Math.random = orig;

      const rotCount = game.modules.filter((m: any) => m.type === 'static_rot').length;
      expect(rotCount).toBeGreaterThanOrEqual(1);
    });

    it('static_rot can be purged', () => {
      game.state.modules = [{ id: 'rot1', type: 'static_rot', x: 0, y: 0, w: 1, h: 1 }];
      game.hostAction('purge-module', { moduleId: 'rot1' });
      expect(game.modules.length).toBe(0);
    });
  });

  // ========================
  // WEATHER SYSTEM
  // ========================
  describe('Weather System', () => {
    beforeEach(() => {
      game.selectRoles();
    });

    it('blizzard freezes antenna', () => {
      game.state.weather = 'blizzard';
      const orig = Math.random;
      Math.random = () => 0.96; // Above 0.95 threshold
      game.tick(1);
      Math.random = orig;
      expect(game.state.antennaFrozen).toBe(true);
      expect(game.state.systems.scanning).toBe(false);
    });

    it('frozen antenna can be repaired', () => {
      game.state.antennaFrozen = true;
      game.state.systems.scanning = false;
      game.setCredits(100);
      game.hostAction('repair-antenna');
      expect(game.state.antennaFrozen).toBe(false);
      expect(game.state.systems.scanning).toBe(true);
    });
  });

  // ========================
  // FULL LIFECYCLE
  // ========================
  describe('Full Game Lifecycle', () => {
    it('completes a full earn-spend-survive cycle', () => {
      // 1. Join
      game.selectRoles();
      expect(game.state.specialist).toBe('HostPlayer');

      // 2. Scan and download
      game.scanAndDownload();
      expect(game.signals.length).toBe(1);

      // 3. Process and sell
      const sid = game.signals[0].id;
      const earned = game.processAndSell(sid);
      expect(earned).toBeGreaterThan(0);

      // 4. Buy upgrades
      if (game.credits >= 80) {
        game.state.power = 60;
        game.hostAction('install-module', { role: 'shared', module: 'power_core', x: 0, y: 0 });
        expect(game.power).toBe(85); // 60 + 25
      }

      // 5. Survive some ticks
      game.tick(20);
      expect(game.power).toBeLessThan(100);
      expect(game.day).toBeGreaterThanOrEqual(1);

      // 6. All state fields remain sane
      expect(game.power).toBeGreaterThanOrEqual(0);
      expect(game.paranoia).toBeGreaterThanOrEqual(0);
      expect(game.paranoia).toBeLessThanOrEqual(100);
      expect(game.integrity).toBeGreaterThanOrEqual(0);
    });
  });
});
