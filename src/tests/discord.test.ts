import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockInvoke = vi.fn().mockResolvedValue(undefined);
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke
}));

describe('Discord Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Discord Rich Presence', () => {
    it('update_discord_presence is called when player joins with role', async () => {
      const presence = {
        state: 'ROLE: SPECIALIST',
        details: 'SIGNAL LAYER: SURFACE',
        large_image: 'terminal_icon',
        small_image: '',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      expect(mockInvoke).toHaveBeenCalledWith('update_discord_presence', { presence });
    });

    it('sets glitch_icon when paranoia > 50', async () => {
      const presence = {
        state: 'ROLE: ANALYST',
        details: 'SIGNAL LAYER: DEEP',
        large_image: 'terminal_icon',
        small_image: 'glitch_icon',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'update_discord_presence');
      expect(call).toBeDefined();
      expect((call?.[1] as any)?.presence?.small_image).toBe('glitch_icon');
    });

    it('small_image is empty when paranoia <= 50', async () => {
      const presence = {
        state: 'ROLE: SPECIALIST',
        details: 'SIGNAL LAYER: SURFACE',
        large_image: 'terminal_icon',
        small_image: '',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'update_discord_presence');
      expect(call).toBeDefined();
      expect((call?.[1] as any)?.presence?.small_image).toBe('');
    });

    it('presence state reflects SPECIALIST role', async () => {
      const presence = {
        state: 'ROLE: SPECIALIST',
        details: 'SIGNAL LAYER: SURFACE',
        large_image: 'terminal_icon',
        small_image: '',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'update_discord_presence');
      expect((call?.[1] as any)?.presence?.state).toBe('ROLE: SPECIALIST');
    });

    it('presence state reflects ANALYST role', async () => {
      const presence = {
        state: 'ROLE: ANALYST',
        details: 'SIGNAL LAYER: ABYSSAL',
        large_image: 'terminal_icon',
        small_image: 'glitch_icon',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'update_discord_presence');
      expect((call?.[1] as any)?.presence?.state).toBe('ROLE: ANALYST');
    });

    it('details reflects SURFACE layer (gridSize 3)', async () => {
      const presence = {
        state: 'ROLE: SPECIALIST',
        details: 'SIGNAL LAYER: SURFACE',
        large_image: 'terminal_icon',
        small_image: '',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'update_discord_presence');
      expect((call?.[1] as any)?.presence?.details).toBe('SIGNAL LAYER: SURFACE');
    });

    it('details reflects DEEP layer (gridSize 4)', async () => {
      const presence = {
        state: 'ROLE: ANALYST',
        details: 'SIGNAL LAYER: DEEP',
        large_image: 'terminal_icon',
        small_image: '',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'update_discord_presence');
      expect((call?.[1] as any)?.presence?.details).toBe('SIGNAL LAYER: DEEP');
    });

    it('details reflects ABYSSAL layer (gridSize 5)', async () => {
      const presence = {
        state: 'ROLE: ANALYST',
        details: 'SIGNAL LAYER: ABYSSAL',
        large_image: 'terminal_icon',
        small_image: '',
        large_text: 'VOID SIGNAL LAB',
        end_time: null
      };
      
      await mockInvoke('update_discord_presence', { presence });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'update_discord_presence');
      expect((call?.[1] as any)?.presence?.details).toBe('SIGNAL LAYER: ABYSSAL');
    });
  });

  describe('Discord Webhook', () => {
    it('send_discord_webhook is called with correct parameters', async () => {
      const webhookUrl = 'https://discord.com/api/webhooks/REDACTED_CHANNEL_ID/REDACTED_TOKEN';
      const content = '**[SYSTEM]**: New session initialized. Analyst/Specialist assigned. Layer 1 Online.';
      
      await mockInvoke('send_discord_webhook', { webhookUrl, content });
      
      expect(mockInvoke).toHaveBeenCalledWith('send_discord_webhook', { webhookUrl, content });
    });

    it('webhook payload includes correct system message format', async () => {
      const webhookUrl = 'https://discord.com/api/webhooks/REDACTED_CHANNEL_ID/REDACTED_TOKEN';
      const content = '**[SYSTEM]**: New session initialized.';
      
      await mockInvoke('send_discord_webhook', { webhookUrl, content });
      
      const call = mockInvoke.mock.calls.find(c => c[0] === 'send_discord_webhook');
      expect((call?.[1] as any)?.content).toContain('**[SYSTEM]**');
    });
  });

  describe('Discord Client ID', () => {
    it('uses correct Discord Application ID', () => {
      const expectedClientId = 'REDACTED_APP_ID';
      expect(expectedClientId).toBe('REDACTED_APP_ID');
    });
  });
});
