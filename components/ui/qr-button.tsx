"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  textToCopy: string;
}

export function CopyButton({ textToCopy }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      toast.success("Command copied to clipboard");
      
      // Kembalikan icon ke bentuk semula setelah 2 detik
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    } catch {
      // Dihapus penulisan 'err' di sini karena tidak dipakai
      toast.error("Failed to copy text");
    }
  };

  return (
    <button
      // Menggunakan void secara eksplisit agar TypeScript tahu kita 
      // sengaja tidak menunggu (await) promise dari event klik ini
      onClick={() => void handleCopy()} 
      className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
      aria-label="Copy command"
    >
      {hasCopied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}