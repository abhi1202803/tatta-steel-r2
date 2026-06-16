"use client";

import { useCallback, useState } from "react";
import { chatService } from "@/services/chat";

export function useChat(initialEquipmentId = "PUMP-05") {
  const [equipmentId, setEquipmentId] = useState(initialEquipmentId);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; recommendations?: string[]; sources?: string[] }[]
  >([]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);
      try {
        const result = await chatService.send(text, equipmentId);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.response,
            recommendations: result.recommendations,
            sources: result.sources,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Unable to reach the maintenance API." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [equipmentId, loading]
  );

  return { messages, loading, equipmentId, setEquipmentId, sendMessage };
}
