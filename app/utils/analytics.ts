declare global {
  interface Window {
    trackMessage: (message: string, type: string, version?: string) => void;
    trackQuickReply: (selectedReply: string, version?: string) => void;
    gtag: (command: string, eventName: string, eventParams?: Record<string, any>) => void;
  }
}

export const trackMessage = (message: string, type: string, version?: string) => {
  if (typeof window !== 'undefined' && window.trackMessage) {
    window.trackMessage(message, type, version);
  }
};

export const trackQuickReply = (selectedReply: string, version?: string) => {
  if (typeof window !== 'undefined' && window.trackQuickReply) {
    window.trackQuickReply(selectedReply, version);
  }
}; 