import { invoke } from '@tauri-apps/api/core';

export const useOsIntegration = () => {
  const shakeWindow = () => {
    invoke('shake_window').catch(console.warn);
  };

  const sendVoidNotification = (title: string, body: string) => {
    invoke('send_void_notification', { title, body }).catch(console.warn);
  };

  return { shakeWindow, sendVoidNotification };
};
