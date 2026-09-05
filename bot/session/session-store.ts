import { CONVERSATION_TIMEOUT_MS } from "@/bot/config";
import { botLogger } from "@/bot/utils/logger";

export interface LaporFlowData {
  categoryId?: string;
  categoryName?: string;
  location?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  priority?: "RENDAH" | "SEDANG" | "TINGGI" | "URGENT";
  description?: string;
  photoPaths?: string[];
  videoPaths?: string[];
  documentPaths?: string[];
  notes?: string;
}

export type LaporFlowStep =
  | "CATEGORY"
  | "LOCATION"
  | "DATE"
  | "TIME"
  | "PRIORITY"
  | "DESCRIPTION"
  | "PHOTO"
  | "VIDEO"
  | "DOCUMENT"
  | "NOTES"
  | "CONFIRM";

export interface ConversationSession {
  jid: string;
  flowName: "LAPOR";
  step: LaporFlowStep;
  data: LaporFlowData;
  history: LaporFlowStep[]; // dipakai untuk fitur "kembali"
  createdAt: number;
  updatedAt: number;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

type OnTimeout = (jid: string) => void;

const sessions = new Map<string, ConversationSession>();

export const sessionStore = {
  start(jid: string, onTimeout: OnTimeout): ConversationSession {
    sessionStore.clear(jid);

    const session: ConversationSession = {
      jid,
      flowName: "LAPOR",
      step: "CATEGORY",
      data: {},
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeoutHandle: setTimeout(() => {
        botLogger.info({ jid }, "Conversation flow timed out");
        sessionStore.clear(jid);
        onTimeout(jid);
      }, CONVERSATION_TIMEOUT_MS),
    };

    sessions.set(jid, session);
    return session;
  },

  get(jid: string): ConversationSession | undefined {
    return sessions.get(jid);
  },

  update(jid: string, patch: Partial<Pick<ConversationSession, "step" | "data">>, onTimeout: OnTimeout): ConversationSession | undefined {
    const existing = sessions.get(jid);
    if (!existing) return undefined;

    clearTimeout(existing.timeoutHandle);

    if (patch.step) {
      existing.history.push(existing.step);
      existing.step = patch.step;
    }
    if (patch.data) {
      existing.data = { ...existing.data, ...patch.data };
    }
    existing.updatedAt = Date.now();
    existing.timeoutHandle = setTimeout(() => {
      botLogger.info({ jid }, "Conversation flow timed out");
      sessionStore.clear(jid);
      onTimeout(jid);
    }, CONVERSATION_TIMEOUT_MS);

    return existing;
  },

  goBack(jid: string): ConversationSession | undefined {
    const existing = sessions.get(jid);
    if (!existing || existing.history.length === 0) return existing;

    const previousStep = existing.history.pop();
    if (previousStep) {
      existing.step = previousStep;
    }
    existing.updatedAt = Date.now();
    return existing;
  },

  clear(jid: string): void {
    const existing = sessions.get(jid);
    if (existing) {
      clearTimeout(existing.timeoutHandle);
      sessions.delete(jid);
    }
  },

  has(jid: string): boolean {
    return sessions.has(jid);
  },

  clearAll(): void {
    for (const jid of sessions.keys()) {
      sessionStore.clear(jid);
    }
  },
};
