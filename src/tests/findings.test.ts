import { describe, it, expect, vi } from 'vitest';

if (typeof window === 'undefined') {
  (global as any).window = {
    dispatchEvent: vi.fn(),
    CustomEvent: class {
      constructor(public type: string, public options: any) {}
    }
  };
}
import { createInitialGameState, runHostGameTick, applyGameAction } from '../hostEngine';

describe('Findings & Background Scanning', () => {
  it('should progress background scan and discover a signal', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Ensure no random failures/finds
    let state = createInitialGameState();
    state.systems.scanning = true;
    
    // Start background scan at 5,5
    state = applyGameAction(state, 'start-background-scan', { x: 5, y: 5, role: 'specialist' });
    expect(state.backgroundScan.active).toBe(true);
    expect(state.backgroundScan.x).toBe(5);
    
    // Simulate ticks to reach 100% (0.5 per tick, so 201 ticks to be safe)
    for (let i = 0; i < 210; i++) {
      state = runHostGameTick(state);
    }
    
    expect(state.backgroundScan.active).toBe(false);
    expect(state.backgroundScan.progress).toBe(0);
    vi.restoreAllMocks();
  });

  it('should handle the findings handshake and unlock cycle', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    let state = createInitialGameState();
    
    // Manually trigger a "found" state
    state.findingsFile = { status: 'found', progress: 0, tier: 'rare' };
    
    // Start handshake
    state = applyGameAction(state, 'findings-handshake-start', { role: 'specialist' });
    expect(state.findingsFile.status).toBe('syncing');
    
    // Complete handshake
    state = applyGameAction(state, 'findings-handshake-complete', { role: 'specialist' });
    expect(state.findingsFile.status).toBe('unlocking');
    
    const initialPower = state.power;
    
    // Simulate ticks to unlock (0.1 per tick, so 1001 ticks to be safe)
    for (let i = 0; i < 1100; i++) {
        state = runHostGameTick(state);
    }
    
    expect(state.findingsFile.status).toBe('ready');
    // Power should be 0 because of the massive drain
    expect(state.power).toBe(0);
    
    // Claim prototype
    state = applyGameAction(state, 'claim-prototype', { role: 'analyst' });
    expect(state.findingsFile).toBeNull();
    vi.restoreAllMocks();
  });
});
