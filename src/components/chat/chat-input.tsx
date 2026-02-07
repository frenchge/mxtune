"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotoSelector } from "./moto-selector";
import { Send, Loader2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  selectedMotoId?: Id<"motos">;
  selectedKitId?: Id<"suspensionKits">;
  onSelectMoto?: (motoId: Id<"motos">, kitId?: Id<"suspensionKits">) => void;
  showMotoSelector?: boolean;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Discute avec l'expert...",
  selectedMotoId,
  selectedKitId,
  onSelectMoto,
  showMotoSelector = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 p-3 border border-zinc-800 bg-zinc-900 rounded-xl w-full"
    >
      {showMotoSelector && onSelectMoto && (
        <MotoSelector
          selectedMotoId={selectedMotoId}
          selectedKitId={selectedKitId}
          onSelectMoto={onSelectMoto}
        />
      )}
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-purple-500 h-11"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || isLoading}
        className="bg-purple-500 hover:bg-purple-600 text-white shrink-0 h-11 w-11"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
