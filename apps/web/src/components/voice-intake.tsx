"use client";

import { useState } from "react";
import { VoiceClient } from "@ziddi/gemini";

interface VoiceIntakeProps {
  apiKey: string;
  onExtraction: (data: {
    transcript: string;
    kind: string;
    summary: string;
    city: string;
    state: string;
    urgency: string;
    amountRupees?: number;
  }) => void;
}

export function VoiceIntake({ apiKey, onExtraction }: VoiceIntakeProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<VoiceClient | null>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    const voiceClient = new VoiceClient(apiKey);
    setClient(voiceClient);

    const result = await voiceClient.startSession(
      (text) => setTranscript(text),
      (data) => {
        if (data.extracted !== null) {
          onExtraction(data.extracted as any);
        }
      },
    );

    if (result.isErr()) {
      setError(JSON.stringify(result.error));
      return;
    }

    setStopFn(() => result.value.stop);
    setRecording(true);
  };

  const stopRecording = () => {
    if (stopFn !== null) {
      stopFn();
      setRecording(false);
      setStopFn(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            recording
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-[var(--primary)] text-white hover:opacity-90"
          }`}
        >
          {recording ? "⏹️ Stop Recording" : "🎤 Voice Intake"}
        </button>
        {recording && (
          <span className="text-xs text-red-600 animate-pulse">● Recording...</span>
        )}
      </div>

      {error !== null && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {transcript.length > 0 && (
        <div className="rounded-md bg-[var(--muted)] p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">Transcript:</p>
          <p className="text-sm text-gray-800">{transcript}</p>
        </div>
      )}
    </div>
  );
}
