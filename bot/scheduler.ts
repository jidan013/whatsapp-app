import cron from "node-cron";
import { backupService } from "@/server/backup/backup.service";
import { botLogger } from "@/bot/utils/logger";

export function startBackupScheduler(): void {
  const schedule = process.env.BACKUP_CRON_SCHEDULE ?? "0 2 * * *";

  if (!cron.validate(schedule)) {
    botLogger.error({ schedule }, "BACKUP_CRON_SCHEDULE tidak valid, scheduler tidak dijalankan");
    return;
  }

  cron.schedule(schedule, () => {
    botLogger.info("Menjalankan backup otomatis terjadwal");
    void backupService
      .runBackup({ type: "FULL", isAutomatic: true })
      .then((result) => botLogger.info({ backupId: result.id, status: result.status }, "Backup otomatis selesai"))
      .catch((error: unknown) => botLogger.error({ err: error }, "Backup otomatis gagal"));
  });

  // Pembersihan backup lama dijalankan sekali sehari, 1 jam setelah backup utama.
  cron.schedule("0 3 * * *", () => {
    void backupService
      .pruneOldBackups()
      .then((count) => botLogger.info({ count }, "Pembersihan backup lama selesai"))
      .catch((error: unknown) => botLogger.error({ err: error }, "Pembersihan backup lama gagal"));
  });

  botLogger.info({ schedule }, "Backup scheduler aktif");
}
