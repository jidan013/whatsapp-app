import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { settingsService } from "@/services/settings.service";
import { botClient } from "@/lib/bot-client";
import { ForbiddenError } from "@/types/domain-errors";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare, ArrowRight } from "lucide-react";
import { WhatsAppConnectionCard } from "@/components/settings/whatsapp-connection-card";
import { BotConfigEditor } from "@/components/settings/bot-config-editor";
import { CopyButton } from "@/components/ui/qr-button";

export const metadata: Metadata = { title: "Settings" };

interface BotCommand {
  command: string;
  description: string;
  example?: string;
}

interface ConfigValue {
  [key: string]: unknown;
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    assertPermission(session, PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const [settings, botStatus] = await Promise.all([
    settingsService.list(),
    botClient.getStatus(),
  ]);

  const config: ConfigValue = {};
  settings.forEach((s) => {
    config[s.key] = s.value;
  });

  const rawBotCommands = config["bot.commands"];
  const botCommands: BotCommand[] = Array.isArray(rawBotCommands)
    ? (rawBotCommands as BotCommand[])
    : [
        {
          command: "#agenda [date]",
          description:
            "Retrieves the daily schedule for the specified date. Defaults to today if no date is provided.",
        },
        {
          command: "#lapor [issue]",
          description:
            "Creates a new high-priority work order from the chat context. Attach media to include it in the report.",
        },
      ];

  const webhookUrl = (config["webhook.url"] as string) || "https://example.com/webhook";

  return (
    <div className="space-y-10 pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your workspace configuration and integrations.
        </p>
      </div>

      <div className="space-y-10">
        {/* Section Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <MessageSquare className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              WhatsApp Integration
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
            Configure how WorkHub communicates with your WhatsApp Business
            account. This connection enables automated alerts and bot commands.
          </p>
        </div>

        {/* Primary Connection Details */}
        <WhatsAppConnectionCard initialStatus={botStatus} />

        {/* Bot Commands & Webhooks Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Bot Commands
            </h3>
            {/* Action button editor (Default trigger) */}
            <BotConfigEditor
              initialCommands={botCommands}
              initialWebhookUrl={webhookUrl}
            />
          </div>

          {/* Grid for Commands */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {botCommands.map((cmd, idx) => {
              const categoryLabel = cmd.command.includes("agenda")
                ? "AGENDA SYNC"
                : cmd.command.includes("lapor")
                ? "REPORTING"
                : "COMMAND";

              return (
                <Card key={idx} className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      {categoryLabel}
                    </span>
                    {/* Menggunakan Client Component untuk fungsi Copy */}
                    <CopyButton textToCopy={cmd.command} />
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 font-semibold text-slate-900">
                      {cmd.command}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {cmd.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Custom Automation / Webhooks */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  CUSTOM AUTOMATION
                </span>
                <p className="font-semibold text-slate-900">
                  Configure Webhooks
                </p>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                  Set up custom endpoint listeners to trigger external workflows
                  when specific WhatsApp messages are received.
                </p>
              </div>
              
              {/* Menggunakan BotConfigEditor dengan custom trigger untuk tombol Manage */}
              <BotConfigEditor
                initialCommands={botCommands}
                initialWebhookUrl={webhookUrl}
                trigger={
                  <button className="group flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                    Manage 
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}