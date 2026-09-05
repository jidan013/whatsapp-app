export interface BotState {
  connected: boolean;
  phoneNumber: string | null;
  lastConnectedAt: string | null;
  qrDataUrl: string | null;
}

const state: BotState = {
  connected: false,
  phoneNumber: null,
  lastConnectedAt: null,
  qrDataUrl: null,
};

export function getBotState(): BotState {
  return { ...state };
}

export function setConnected(phoneNumber: string | null): void {
  state.connected = true;
  state.phoneNumber = phoneNumber;
  state.lastConnectedAt = new Date().toISOString();
  state.qrDataUrl = null;
}

export function setDisconnected(): void {
  state.connected = false;
  state.phoneNumber = null;
  state.qrDataUrl = null;
}

export function setQrDataUrl(dataUrl: string | null): void {
  state.qrDataUrl = dataUrl;
}

export function getQrDataUrl(): string | null {
  return state.qrDataUrl;
}