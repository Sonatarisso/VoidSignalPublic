export interface ModuleData {
  id: string;
  name: string;
  cost: number;
  type: 'consumable' | 'permanent';
  w: number;
  h: number;
  powerDrain: number;
  role: 'shared' | 'specialist' | 'analyst';
  effect?: number;
  isCorruptible?: boolean;
  provokesEntity?: boolean;
  hidden?: boolean;
  isPrototype?: boolean;
  baseType?: string;
}

// Contains core data and pure-ish mutators for Void Signal Lab rules
export const MODULE_DATABASE: Record<string, ModuleData> = {
  // Consumables (No Grid Slot)
  power_core: { id: 'power_core', name: 'Power Core', cost: 80, type: 'consumable', w: 1, h: 1, powerDrain: 0, effect: 25, role: 'shared' },
  hull_plating: { id: 'hull_plating', name: 'Hull Plating', cost: 120, type: 'consumable', w: 1, h: 1, powerDrain: 0, effect: 20, role: 'shared' },
  sedatives: { id: 'sedatives', name: 'Sedatives', cost: 100, type: 'consumable', w: 1, h: 1, powerDrain: 0, effect: -15, role: 'shared' },

  // Facility (Shared)
  backup_generator: { id: 'backup_generator', name: 'Backup Generator', cost: 250, type: 'permanent', w: 1, h: 2, powerDrain: 0, role: 'shared', isCorruptible: true },
  blast_shielding: { id: 'blast_shielding', name: 'Blast Shielding', cost: 300, type: 'permanent', w: 2, h: 1, powerDrain: 0, role: 'shared', isCorruptible: true },
  emf_dampener: { id: 'emf_dampener', name: 'EMF Dampener', cost: 400, type: 'permanent', w: 2, h: 2, powerDrain: 0.04, role: 'shared', isCorruptible: true, provokesEntity: true },

  // Antenna (Specialist)
  high_gain_array: { id: 'high_gain_array', name: 'High-Gain Array', cost: 300, type: 'permanent', w: 1, h: 2, powerDrain: 0.03, role: 'specialist', isCorruptible: true },
  thermal_sink: { id: 'thermal_sink', name: 'Thermal Sink', cost: 200, type: 'permanent', w: 1, h: 1, powerDrain: 0.02, role: 'specialist', isCorruptible: true },
  deep_space_amplifier: { id: 'deep_space_amplifier', name: 'Deep Space Amp', cost: 500, type: 'permanent', w: 2, h: 2, powerDrain: 0.05, role: 'specialist', isCorruptible: true, provokesEntity: true },
  signal_trap: { id: 'signal_trap', name: 'Signal Trap', cost: 350, type: 'permanent', w: 1, h: 1, powerDrain: 0.04, role: 'specialist', isCorruptible: true },

  // Processing (Analyst)
  neural_accelerator: { id: 'neural_accelerator', name: 'Neural Accelerator', cost: 250, type: 'permanent', w: 1, h: 1, powerDrain: 0.02, role: 'analyst', isCorruptible: true },
  decryption_key: { id: 'decryption_key', name: 'Decryption Key', cost: 400, type: 'permanent', w: 1, h: 2, powerDrain: 0.03, role: 'analyst', isCorruptible: true },
  data_compressor: { id: 'data_compressor', name: 'Data Compressor', cost: 300, type: 'permanent', w: 1, h: 1, powerDrain: 0.02, role: 'analyst', isCorruptible: true },
  auto_filter: { id: 'auto_filter', name: 'Auto-Filter', cost: 600, type: 'permanent', w: 2, h: 2, powerDrain: 0.06, role: 'analyst', isCorruptible: true, provokesEntity: true },

  // Forbidden Tech (Shared)
  void_resonator: { id: 'void_resonator', name: 'Void Resonator', cost: 800, type: 'permanent', w: 2, h: 2, powerDrain: 0.08, role: 'shared', isCorruptible: false },
  entity_cage: { id: 'entity_cage', name: 'Entity Cage', cost: 1000, type: 'permanent', w: 3, h: 3, powerDrain: 0.15, role: 'shared', isCorruptible: false },

  // Horror / Special (Not purchasable)
  parasite: { id: 'parasite', name: 'Unknown Module', cost: 0, type: 'permanent', w: 1, h: 1, powerDrain: 0.15, role: 'shared', isCorruptible: false, hidden: true },
  static_rot: { id: 'static_rot', name: 'Static Rot', cost: 0, type: 'permanent', w: 1, h: 1, powerDrain: 0, role: 'shared', isCorruptible: false }
};

export function checkModuleCollision(room: any, testMod: any): boolean {
  return room.modules.some((m: any) => {
    return !(testMod.x + testMod.w <= m.x || 
             testMod.x >= m.x + m.w || 
             testMod.y + testMod.h <= m.y || 
             testMod.y >= m.y + m.h);
  });
}

export function handleModulePurchase(room: any, requestRole: string, moduleId: string, x: number = 0, y: number = 0, proto?: any): { success: boolean, message: string } {
  let modData = MODULE_DATABASE[moduleId as keyof typeof MODULE_DATABASE];
  
  if (moduleId === 'prototype' && proto) {
    modData = proto;
  }

  if (!modData) return { success: false, message: 'Invalid module' };

  if (room.points < modData.cost) {
    return { success: false, message: 'Insufficient credits' };
  }

  if (modData.role !== 'shared' && modData.role !== requestRole) {
    return { success: false, message: 'Role restriction prevents installation' };
  }

  if (modData.type === 'consumable') {
    room.points -= modData.cost;
    if (moduleId === 'power_core') room.power = Math.min(room.maxPower || 100, room.power + (modData.effect || 0));
    if (moduleId === 'hull_plating') room.integrity = Math.min(100, room.integrity + (modData.effect || 0));
    if (moduleId === 'sedatives') room.paranoia = Math.max(0, room.paranoia + (modData.effect || 0)); // effect is negative
    return { success: true, message: `CONSUMABLE APPLIED: ${modData.name.toUpperCase()}` };
  } else {
    // Max modules cap (gridSize² total permanent slots)
    const permanentCount = room.modules.filter((m: any) => {
      const db = MODULE_DATABASE[m.type as keyof typeof MODULE_DATABASE];
      return db && db.type === 'permanent';
    }).length;
    if (permanentCount >= (room.gridSize || 3) * (room.gridSize || 3)) {
      return { success: false, message: 'Module grid full' };
    }

    // Valid grid bounds (reject negatives, out of range)
    if (x < 0 || y < 0 || x + modData.w > (room.gridSize || 3) || y + modData.h > (room.gridSize || 3)) {
      return { success: false, message: 'Out of bounds' };
    }

    if (checkModuleCollision(room, { x, y, w: modData.w, h: modData.h })) {
      return { success: false, message: 'Space occupied' };
    }

    room.points -= modData.cost;
    room.modules.push({ 
      id: Math.random().toString(36).substr(2, 9),
      type: moduleId, 
      x, y, w: modData.w, h: modData.h, 
      powerDrain: modData.powerDrain,
      corrupted: false,
      overclocked: false,
      isPrototype: modData.isPrototype,
      name: modData.name, // Store name for prototypes
      effect: modData.effect
    });

    return { success: true, message: `MODULE INSTALLED: ${modData.name.toUpperCase()}` };
  }
}

export function calculatePassivePowerDrain(room: any): number {
  let drain = 0.05;
  if (room.systems.scanning) drain += 0.1;
  if (room.systems.processing) drain += 0.1;
  if (room.systems.lights) drain += 0.05;
  if (room.weather === 'blizzard') drain += 0.05; // Heating takes passive power
  if (room.findingsFile?.status === 'unlocking') drain += 0.2; // Massive decryption drain

  let passiveGen = 0;

  room.modules.forEach((m: any) => {
    let modDrain = m.powerDrain || 0;
    
    // Check specific module types
    if (m.type === 'backup_generator') {
      if (m.corrupted) {
         modDrain += 0.1; // Inverted effect: drains instead of gens
      } else {
         passiveGen += 0.05;
      }
    }

    // Overclock multiplier
    if (m.overclocked) {
      modDrain *= 3;
    }

    // Corrupted general drain increase
    if (m.corrupted && m.type !== 'backup_generator') {
      modDrain *= 1.5;
    }

    drain += modDrain;
  });

  return Math.max(0, drain - passiveGen);
}

export function processHorrorMechanicsTick(room: any) {
  // 1. Module Corruption (Paranoia >= 80)
  if (room.paranoia >= 80) {
    room.modules.forEach((m: any) => {
      const dbMod = MODULE_DATABASE[m.type as keyof typeof MODULE_DATABASE];
      if (dbMod && dbMod.isCorruptible && !m.corrupted) {
        if (Math.random() > 0.98) { // 2% chance per tick to corrupt
          m.corrupted = true;
          room.logs.unshift(`WARNING: ${dbMod.name.toUpperCase()} DATABUS CORRUPTION DETECTED.`);
        }
      }
    });
  }

  // 2. Grid Rot (Paranoia >= 90)
  if (room.paranoia >= 90 && Math.random() > 0.95) { // 5% chance per tick to spawn static rot
    // Find an empty 1x1 cell
    let emptyCells = [];
    for (let x = 0; x < room.gridSize; x++) {
      for (let y = 0; y < room.gridSize; y++) {
        if (!checkModuleCollision(room, { x, y, w: 1, h: 1 })) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      room.modules.push({ 
        id: Math.random().toString(36).substr(2, 9),
        type: 'static_rot', 
        x: cell.x, y: cell.y, w: 1, h: 1, 
        powerDrain: 0,
        corrupted: false,
        overclocked: false
      });
      room.logs.unshift("SYSTEM: ANOMALOUS STATIC DETECTED IN MODULE GRID.");
    }
  }

  // 3. Parasite Event (Paranoia >= 85)
  // Happens rarely, silently drains power
  if (room.paranoia >= 85 && Math.random() > 0.99) { // 1% chance per tick
    const hasParasite = room.modules.some((m: any) => m.type === 'parasite');
    if (!hasParasite) {
      // Find an empty 1x1 cell
      let emptyCells = [];
      for (let x = 0; x < room.gridSize; x++) {
        for (let y = 0; y < room.gridSize; y++) {
          if (!checkModuleCollision(room, { x, y, w: 1, h: 1 })) {
            emptyCells.push({ x, y });
          }
        }
      }

      if (emptyCells.length > 0) {
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const dbParasite = MODULE_DATABASE['parasite'];
        room.modules.push({ 
          id: Math.random().toString(36).substr(2, 9),
          type: 'parasite', 
          x: cell.x, y: cell.y, w: 1, h: 1, 
          powerDrain: dbParasite.powerDrain,
          corrupted: false,
          overclocked: false,
          hidden: true
        });
        // No log message. That's the horror.
      }
    }
  }
}

export function generatePrototypeModule(tier: 'common' | 'rare'): any {
  const isRare = tier === 'rare';
  const prefix = isRare ? "EXOTIC" : "UNSTABLE";
  const types = ["RELAY", "PROCESSOR", "COOLER", "SENSE"];
  const selectedType = types[Math.floor(Math.random() * types.length)];
  
  const id = `prototype_${Math.random().toString(36).substr(2, 5)}`;
  const drainBase = isRare ? 0.01 : 0.03;
  const effectBase = isRare ? 40 : 20;

  return {
    id,
    name: `${prefix} ${selectedType}`,
    type: 'permanent',
    w: 1,
    h: 1,
    powerDrain: drainBase + (Math.random() * 0.02),
    role: 'shared',
    baseType: id, // For name lookup fallback
    effect: effectBase + (Math.random() * 20),
    isCorruptible: true,
    isPrototype: true,
    tier
  };
}
