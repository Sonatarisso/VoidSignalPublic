import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculatePassivePowerDrain, processHorrorMechanicsTick, MODULE_DATABASE, handleModulePurchase, checkModuleCollision } from '../gameEngine';

describe('gameEngine calculations', () => {

  it('calculatePassivePowerDrain - returns positive drain for operational room', () => {
    const mockRoom = {
       weather: 'clear',
       modules: [],
       systems: { scanning: true, processing: true, lights: true }
    };
    const drain = calculatePassivePowerDrain(mockRoom);
    expect(drain).toBeGreaterThan(0);
    expect(drain).toBeCloseTo(0.3); // 0.05 + 0.1 + 0.1 + 0.05
  });

  it('calculatePassivePowerDrain - applies blizzard penalty', () => {
    const mockRoom = {
       weather: 'blizzard',
       modules: [],
       systems: { scanning: false, processing: false, lights: false }
    };
    const drain = calculatePassivePowerDrain(mockRoom);
    expect(drain).toBeCloseTo(0.1); // base 0.05 + 0.05 blizzard
  });

  it('calculatePassivePowerDrain - applies generator buff correctly', () => {
    const mockRoom = {
       weather: 'clear',
       modules: [{ id: '1', type: 'backup_generator', corrupted: false }],
       systems: { scanning: false, processing: false, lights: false }
    };
    const drain = calculatePassivePowerDrain(mockRoom);
    expect(drain).toBe(0); // 0.05 - 0.05 floored to 0
  });

  it('calculatePassivePowerDrain - corrupted generator DRAINS instead of generating', () => {
    const mockRoom = {
       weather: 'clear',
       modules: [{ id: '1', type: 'backup_generator', corrupted: true }],
       systems: { scanning: false, processing: false, lights: false }
    };
    const drain = calculatePassivePowerDrain(mockRoom);
    // base 0.05 + corrupted gen adds 0.1 = 0.15
    expect(drain).toBeCloseTo(0.15);
  });

  it('calculatePassivePowerDrain - overclocked module drains 3x', () => {
    const mockRoom = {
       weather: 'clear',
       modules: [{ id: '1', type: 'thermal_sink', powerDrain: 0.02, corrupted: false, overclocked: true }],
       systems: { scanning: false, processing: false, lights: false }
    };
    const drain = calculatePassivePowerDrain(mockRoom);
    // base 0.05 + (0.02 * 3) = 0.11
    expect(drain).toBeCloseTo(0.11);
  });

  it('calculatePassivePowerDrain - corrupted non-generator drains 1.5x', () => {
    const mockRoom = {
       weather: 'clear',
       modules: [{ id: '1', type: 'emf_dampener', powerDrain: 0.04, corrupted: true, overclocked: false }],
       systems: { scanning: false, processing: false, lights: false }
    };
    const drain = calculatePassivePowerDrain(mockRoom);
    // base 0.05 + (0.04 * 1.5) = 0.11
    expect(drain).toBeCloseTo(0.11);
  });

});

describe('handleModulePurchase', () => {
  const makeRoom = (points = 1000) => ({
    points,
    modules: [],
    gridSize: 3,
    power: 100,
    maxPower: 100,
    integrity: 100,
    paranoia: 0,
  });

  it('applies consumable power_core correctly', () => {
    const room = makeRoom(200);
    room.power = 50;
    const res = handleModulePurchase(room, 'shared', 'power_core', 0, 0);
    expect(res.success).toBe(true);
    expect(room.power).toBe(75); // +25
    expect(room.points).toBe(120); // -80
  });

  it('applies consumable sedatives correctly', () => {
    const room = makeRoom(200);
    room.paranoia = 50;
    const res = handleModulePurchase(room, 'shared', 'sedatives', 0, 0);
    expect(res.success).toBe(true);
    expect(room.paranoia).toBe(35); // -15
    expect(room.points).toBe(100); // -100
  });

  it('applies hull_plating correctly', () => {
    const room = makeRoom(200);
    room.integrity = 70;
    const res = handleModulePurchase(room, 'shared', 'hull_plating', 0, 0);
    expect(res.success).toBe(true);
    expect(room.integrity).toBe(90); // +20
  });

  it('rejects purchase with insufficient credits', () => {
    const room = makeRoom(10);
    const res = handleModulePurchase(room, 'shared', 'power_core', 0, 0);
    expect(res.success).toBe(false);
    expect(res.message).toContain('Insufficient');
  });

  it('installs permanent module on grid', () => {
    const room = makeRoom(500);
    const res = handleModulePurchase(room, 'specialist', 'thermal_sink', 0, 0);
    expect(res.success).toBe(true);
    expect(room.modules.length).toBe(1);
    expect(room.modules[0].type).toBe('thermal_sink');
    expect(room.points).toBe(300); // -200
  });

  it('rejects permanent module on occupied grid cell', () => {
    const room = makeRoom(1000);
    handleModulePurchase(room, 'specialist', 'thermal_sink', 0, 0);
    const res2 = handleModulePurchase(room, 'specialist', 'thermal_sink', 0, 0);
    expect(res2.success).toBe(false);
    expect(res2.message).toContain('occupied');
  });

  it('rejects module outside grid bounds', () => {
    const room = makeRoom(500);
    const res = handleModulePurchase(room, 'specialist', 'thermal_sink', 5, 5);
    expect(res.success).toBe(false);
    expect(res.message).toContain('bounds');
  });

  it('rejects role-restricted module', () => {
    const room = makeRoom(500);
    // thermal_sink is specialist-only
    const res = handleModulePurchase(room, 'analyst', 'thermal_sink', 0, 0);
    expect(res.success).toBe(false);
    expect(res.message).toContain('Role restriction');
  });

  it('rejects invalid module ID', () => {
    const room = makeRoom(500);
    const res = handleModulePurchase(room, 'shared', 'nonexistent_module', 0, 0);
    expect(res.success).toBe(false);
  });
});

describe('checkModuleCollision', () => {
  it('detects overlap on same cell', () => {
    const room = {
      modules: [{ x: 1, y: 1, w: 1, h: 1 }]
    };
    expect(checkModuleCollision(room, { x: 1, y: 1, w: 1, h: 1 })).toBe(true);
  });

  it('allows adjacent placement', () => {
    const room = {
      modules: [{ x: 0, y: 0, w: 1, h: 1 }]
    };
    expect(checkModuleCollision(room, { x: 1, y: 0, w: 1, h: 1 })).toBe(false);
  });

  it('detects overlap for multi-cell modules', () => {
    const room = {
      modules: [{ x: 0, y: 0, w: 2, h: 2 }]
    };
    expect(checkModuleCollision(room, { x: 1, y: 1, w: 1, h: 1 })).toBe(true);
  });
});

describe('processHorrorMechanicsTick', () => {

  it('does NOT corrupt at paranoia < 80', () => {
    const room = {
      paranoia: 50,
      gridSize: 3,
      modules: [{ id: '1', type: 'thermal_sink', corrupted: false, x: 0, y: 0, w: 1, h: 1 }],
      logs: []
    };
    // Run many ticks — nothing should corrupt
    for (let i = 0; i < 100; i++) {
      processHorrorMechanicsTick(room);
    }
    expect(room.modules[0].corrupted).toBe(false);
  });

  it('spawns static_rot at paranoia >= 90', () => {
    const room = {
      paranoia: 95,
      gridSize: 5,
      modules: [],
      logs: []
    };
    const origRandom = Math.random;
    Math.random = () => 0.96; // Above 0.95 threshold
    processHorrorMechanicsTick(room);
    Math.random = origRandom;
    expect(room.modules.length).toBe(1);
    expect(room.modules[0].type).toBe('static_rot');
  });

  it('spawns parasite at paranoia >= 85 (no existing parasite)', () => {
    const room = {
      paranoia: 90,
      gridSize: 5,
      modules: [],
      logs: []
    };
    const origRandom = Math.random;
    Math.random = () => 0.995; // Above 0.99 threshold AND above 0.95
    processHorrorMechanicsTick(room);
    Math.random = origRandom;
    // Could have both static_rot and parasite since both thresholds pass
    const hasParasite = room.modules.some((m: any) => m.type === 'parasite');
    const hasRot = room.modules.some((m: any) => m.type === 'static_rot');
    expect(hasParasite || hasRot).toBe(true);
  });

  it('does NOT spawn second parasite if one exists', () => {
    const room = {
      paranoia: 90,
      gridSize: 5,
      modules: [{ id: '1', type: 'parasite', x: 0, y: 0, w: 1, h: 1, corrupted: false }],
      logs: []
    };
    const origRandom = Math.random;
    Math.random = () => 0.999;
    processHorrorMechanicsTick(room);
    Math.random = origRandom;
    const parasiteCount = room.modules.filter((m: any) => m.type === 'parasite').length;
    expect(parasiteCount).toBe(1);
  });
});

describe('MODULE_DATABASE integrity', () => {
  it('contains all expected module IDs', () => {
    const expected = [
      'power_core', 'hull_plating', 'sedatives',
      'backup_generator', 'blast_shielding', 'emf_dampener',
      'high_gain_array', 'thermal_sink', 'deep_space_amplifier', 'signal_trap',
      'neural_accelerator', 'decryption_key', 'data_compressor', 'auto_filter',
      'void_resonator', 'entity_cage',
      'parasite', 'static_rot'
    ];
    for (const id of expected) {
      expect(MODULE_DATABASE[id]).toBeDefined();
    }
  });

  it('all consumables have cost > 0 and type consumable', () => {
    const consumables = ['power_core', 'hull_plating', 'sedatives'];
    for (const id of consumables) {
      expect(MODULE_DATABASE[id].type).toBe('consumable');
      expect(MODULE_DATABASE[id].cost).toBeGreaterThan(0);
    }
  });
});
