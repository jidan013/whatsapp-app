import { BOT_COMMANDS } from "@/bot/config";
import { sessionStore } from "@/bot/session/session-store";
import { startLaporFlow, handleLaporMessage } from "@/bot/flows/lapor.flow";
import {
  handleTodayCommand,
  handleTomorrowCommand,
  handleWeekCommand,
  handleMonthCommand,
  handlePendingCommand,
  handleStatisticsCommand,
  handleProfileCommand,
  handlePingCommand,
  handleHelpCommand,
} from "@/bot/handlers/read-commands";
import {
  handleDetailCommand,
  handleSearchCommand,
  handleCompleteCommand,
  handleDeleteCommand,
} from "@/bot/handlers/mutation-commands";
import { botLogger } from "@/bot/utils/logger";

export interface RouterReply {
  text: string;
}

/**
 * Dipanggil oleh connection.ts saat menerima pesan teks. `onFlowTimeout` dipakai
 * agar flow yang timeout bisa mengirim notifikasi balik ke user via socket.
 */
export async function routeIncomingMessage(
  jid: string,
  rawText: string,
  onFlowTimeout: (jid: string) => void,
): Promise<RouterReply> {
  const text = rawText.trim();
  const lowerText = text.toLowerCase();
  const firstSpaceIndex = text.indexOf(" ");
  const commandWord = (firstSpaceIndex === -1 ? text : text.slice(0, firstSpaceIndex)).toLowerCase();
  const commandArgument = firstSpaceIndex === -1 ? "" : text.slice(firstSpaceIndex + 1);

  // Jika user sedang di tengah flow #lapor, semua pesan (kecuali command lain yang eksplisit)
  // diteruskan ke flow handler dulu.
  if (sessionStore.has(jid) && !lowerText.startsWith("#")) {
    const reply = await handleLaporMessage(jid, text, onFlowTimeout);
    return { text: reply.text };
  }

  // Command dengan argumen (#detail <id>, #search <kata kunci>, dst) dicek dulu
  // berdasarkan kata pertama, karena switch-case di bawah butuh exact match teks penuh.
  switch (commandWord) {
    case BOT_COMMANDS.DETAIL:
      return { text: await handleDetailCommand(commandArgument) };
    case BOT_COMMANDS.SEARCH:
      return { text: await handleSearchCommand(commandArgument) };
    case BOT_COMMANDS.COMPLETE:
      return { text: await handleCompleteCommand(commandArgument, jid) };
    case BOT_COMMANDS.DELETE:
      return { text: await handleDeleteCommand(commandArgument, jid) };
  }

  switch (lowerText) {
    case BOT_COMMANDS.HELP:
      return { text: handleHelpCommand() };

    case BOT_COMMANDS.LAPOR: {
      const reply = await startLaporFlow(jid, onFlowTimeout);
      return { text: reply.text };
    }

    case BOT_COMMANDS.TODAY:
      return { text: await handleTodayCommand() };

    case BOT_COMMANDS.TOMORROW:
      return { text: await handleTomorrowCommand() };

    case BOT_COMMANDS.WEEK:
      return { text: await handleWeekCommand() };

    case BOT_COMMANDS.MONTH:
      return { text: await handleMonthCommand() };

    case BOT_COMMANDS.PENDING:
      return { text: await handlePendingCommand() };

    case BOT_COMMANDS.STATISTICS:
      return { text: await handleStatisticsCommand() };

    case BOT_COMMANDS.PROFILE:
      return { text: await handleProfileCommand(jid) };

    case BOT_COMMANDS.PING:
      return { text: handlePingCommand() };

    case BOT_COMMANDS.DETAIL:
      return { text: 'Format: "#detail <id-agenda>"' };

    case BOT_COMMANDS.SEARCH:
      return { text: 'Format: "#search <kata kunci>"' };

    case BOT_COMMANDS.COMPLETE:
      return { text: 'Format: "#complete <id-agenda>"' };

    case BOT_COMMANDS.DELETE:
      return { text: 'Format: "#delete <id-agenda>"' };

    case BOT_COMMANDS.AGENDA:
    case BOT_COMMANDS.CALENDAR:
    case BOT_COMMANDS.EDIT:
    case BOT_COMMANDS.DASHBOARD:
    case BOT_COMMANDS.BACKUP:
    case BOT_COMMANDS.RESTORE:
    case BOT_COMMANDS.EXPORT:
    case BOT_COMMANDS.PDF:
    case BOT_COMMANDS.EXCEL:
    case BOT_COMMANDS.SETTINGS:
      botLogger.info({ jid, command: lowerText }, "Command belum diimplementasikan sepenuhnya");
      return {
        text: `Perintah "${lowerText}" saat ini hanya tersedia lewat dashboard web, belum lewat WhatsApp. Gunakan #help untuk melihat perintah yang tersedia lewat bot.`,
      };

    default:
      if (lowerText.startsWith("#")) {
        return { text: `Perintah tidak dikenali. Ketik ${BOT_COMMANDS.HELP} untuk melihat daftar perintah.` };
      }
      return { text: `Ketik ${BOT_COMMANDS.HELP} untuk melihat daftar perintah yang tersedia.` };
  }
}
