declare global {
  interface Window {
    trackMessage: (message: string, type: string) => void;
    trackQuickReply: (selectedReply: string) => void;
    gtag: (command: string, eventName: string, eventParams?: Record<string, any>) => void;
  }
}

export const trackMessage = (message: string, type: string) => {
  if (typeof window !== 'undefined' && window.trackMessage) {
    window.trackMessage(message, type);
  }
};

export const trackQuickReply = (selectedReply: string) => {
  if (typeof window !== 'undefined' && window.trackQuickReply) {
    window.trackQuickReply(selectedReply);
  }
}; 