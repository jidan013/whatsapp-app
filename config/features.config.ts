export const FEATURES_CONFIG = {
  emailNotificationEnabled: process.env.EMAIL_ENABLED === "true",
  backupEncryptionEnabled: process.env.BACKUP_ENCRYPT !== "false",
} as const;
