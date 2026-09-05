"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Mic } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const RECENT_SEARCHES_KEY = "agenda-system:recent-searches";
const MAX_RECENT = 5;

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  const existing = readRecentSearches().filter((item) => item.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...existing].slice(0, MAX_RECENT);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(initialQuery);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceSupported, setVoiceSupported] = React.useState(false);

  React.useEffect(() => {
    setRecentSearches(readRecentSearches());
    const globalWindow = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    setVoiceSupported(Boolean(globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition));
  }, []);

  function runSearch(value: string) {
    const trimmed = value.trim();
    saveRecentSearch(trimmed);
    setRecentSearches(readRecentSearches());
    const next = new URLSearchParams(searchParams.toString());
    if (trimmed) next.set("q", trimmed);
    else next.delete("q");
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    runSearch(query);
  }

  function handleVoiceInput() {
    const globalWindow = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setQuery(transcript);
        runSearch(transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    recognition.start();
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari work order, user, atau file..."
          className="h-12 w-full rounded-lg border bg-background pl-11 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {voiceSupported ? (
          <button
            type="button"
            onClick={handleVoiceInput}
            aria-label="Cari dengan suara"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
              isListening && "animate-pulse text-red-500",
            )}
          >
            <Mic className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      {recentSearches.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">Recent:</span>
          {recentSearches.map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term);
                runSearch(term);
              }}
              className="rounded-full border px-2.5 py-1 hover:bg-accent"
            >
              &quot;{term}&quot;
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}