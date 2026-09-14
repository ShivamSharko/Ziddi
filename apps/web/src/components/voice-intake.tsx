"use client";

import { useState, useRef } from "react";

interface VoiceIntakeProps {
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

export function VoiceIntake({ onExtraction }: VoiceIntakeProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError(`Microphone access denied: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/voice-intake", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Voice processing failed");
      }

      setTranscript(data.transcript);
      
      if (data.extracted) {
        onExtraction(data.extracted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 ${
            recording
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-[var(--primary)] text-white hover:opacity-90"
          }`}
        >
          {processing ? "⏳ Processing..." : recording ? "⏹️ Stop Recording" : "🎤 Voice Intake"}
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
