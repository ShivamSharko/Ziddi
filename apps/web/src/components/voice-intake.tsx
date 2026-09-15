"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

interface ExtractedCase {
  transcript: string;
  kind: string;
  summary: string;
  city: string;
  state: string;
  urgency: string;
  amountRupees?: number;
}

interface VoiceIntakeProps {
  onExtraction: (data: ExtractedCase) => void;
}

const resampleTo16k = (input: Float32Array, inputRate: number): Int16Array => {
  const ratio = inputRate / 16000;
  const outLength = Math.max(1, Math.floor(input.length / ratio));
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] ?? 0;
    const b = input[idx + 1] ?? a;
    const s = Math.max(-1, Math.min(1, a + (b - a) * frac));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
};

export function VoiceIntake({ onExtraction }: VoiceIntakeProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunkRef = useRef<ReadableStreamDefaultController<Uint8Array> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const modeRef = useRef<"live" | "upload">("live");

  const releaseMic = () => {
    try {
      processorRef.current?.disconnect();
    } catch {
      // already disconnected
    }
    try {
      sourceRef.current?.disconnect();
    } catch {
      // already disconnected
    }
    try {
      chunkRef.current?.close();
    } catch {
      // already closed
    }
    if (contextRef.current !== null && contextRef.current.state !== "closed") {
      void contextRef.current.close();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (recorderRef.current !== null && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    processorRef.current = null;
    sourceRef.current = null;
    chunkRef.current = null;
    contextRef.current = null;
    streamRef.current = null;
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      releaseMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLine = (line: string) => {
    if (line.trim().length === 0) return;
    const msg = JSON.parse(line) as {
      type: string;
      text?: string;
      transcript?: string;
      extracted?: ExtractedCase | null;
      message?: string;
    };
    if (msg.type === "partial" && typeof msg.text === "string") {
      setTranscript(msg.text);
    }
    if (msg.type === "final") {
      if (typeof msg.transcript === "string") setTranscript(msg.transcript);
      if (msg.extracted !== null && msg.extracted !== undefined) onExtraction(msg.extracted);
    }
    if (msg.type === "error" && typeof msg.message === "string") {
      setError(msg.message);
    }
  };

  const startLive = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const context = new AudioContext();
    contextRef.current = context;
    const source = context.createMediaStreamSource(stream);
    sourceRef.current = source;
    const processor = context.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    source.connect(processor);
    processor.connect(context.destination);

    const body = new ReadableStream<Uint8Array>({
      start(c) {
        chunkRef.current = c;
      },
    });

    processor.onaudioprocess = (e) => {
      const cc = chunkRef.current;
      if (cc === null) return;
      const pcm = resampleTo16k(e.inputBuffer.getChannelData(0), context.sampleRate);
      cc.enqueue(new Uint8Array(pcm.buffer));
    };

    const response = await fetch("/api/live-intake", {
      method: "POST",
      body,
      // @ts-expect-error duplex is required for streaming request bodies
      duplex: "half",
    });

    if (!response.ok || response.body === null) {
      releaseMic();
      throw new Error("live-unavailable");
    }

    modeRef.current = "live";
    setRecording(true);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    void (async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) handleLine(line);
        }
      } catch {
        // aborted
      } finally {
        releaseMic();
      }
    })();
  };

  const startUploadFallback = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorderRef.current = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = async () => {
      setProcessing(true);
      try {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob);
        const res = await fetch("/api/voice-intake", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Voice processing failed");
        setTranscript(data.transcript ?? "");
        if (data.extracted) onExtraction(data.extracted as ExtractedCase);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Voice processing failed");
      } finally {
        releaseMic();
        setProcessing(false);
      }
    };
    modeRef.current = "upload";
    setRecording(true);
    recorder.start();
  };

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    setProcessing(true);
    try {
      try {
        await startLive();
      } catch {
        await startUploadFallback();
      }
    } catch (e) {
      releaseMic();
      setError(e instanceof Error ? e.message : "Microphone unavailable");
    } finally {
      setProcessing(false);
    }
  };

  const stopRecording = () => {
    if (modeRef.current === "upload" && recorderRef.current !== null && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      return;
    }
    releaseMic();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={recording ? stopRecording : () => void startRecording()}
          disabled={processing}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-40 ${
            recording
              ? "bg-[var(--ember)] text-white"
              : "border border-[var(--signal)] text-[var(--signal)] hover:bg-[var(--signal)] hover:text-white"
          }`}
        >
          <Mic size={14} />
          {processing ? "Connecting..." : recording ? "Stop Recording" : "Voice Intake (Live)"}
        </button>
        {recording && (
          <span className="font-mono-data text-[10px] text-[var(--ember)] animate-pulse">
            ● LIVE STREAM
          </span>
        )}
      </div>

      {error !== null && <p className="text-xs text-[var(--ember)]">{error}</p>}

      {transcript.length > 0 && (
        <div className="crop-frame dim p-3">
          <p className="mb-1 font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--text-2)]">
            Live transcript
          </p>
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
}
