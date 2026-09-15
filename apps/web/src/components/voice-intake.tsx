"use client";

import { useRef, useState } from "react";
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

interface LiveRefs {
  stream: MediaStream;
  context: AudioContext;
  processor: ScriptProcessorNode;
  source: MediaStreamAudioSourceNode;
  chunkController: ReadableStreamDefaultController<Uint8Array>;
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
  const liveRefs = useRef<LiveRefs | null>(null);
  const modeRef = useRef<"live" | "upload">("live");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(context.destination);

    let chunkController: ReadableStreamDefaultController<Uint8Array> | null = null;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        chunkController = c;
      },
    });

    processor.onaudioprocess = (e) => {
      if (chunkController === null) return;
      const pcm = resampleTo16k(e.inputBuffer.getChannelData(0), context.sampleRate);
      chunkController.enqueue(new Uint8Array(pcm.buffer));
    };

    const response = await fetch("/api/live-intake", {
      method: "POST",
      body,
      // @ts-expect-error duplex is required for streaming request bodies
      duplex: "half",
    });

    if (!response.ok || response.body === null) {
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void context.close();
      throw new Error("live-unavailable");
    }

    if (chunkController === null) throw new Error("live-unavailable");
    liveRefs.current = { stream, context, processor, source, chunkController };
    modeRef.current = "live";

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
        // stream aborted on stop
      }
    })();
  };

  const startUploadFallback = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      setProcessing(true);
      try {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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
        stream.getTracks().forEach((t) => t.stop());
        setProcessing(false);
      }
    };
    recorderRef.current = recorder;
    modeRef.current = "upload";
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
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone unavailable");
    } finally {
      setProcessing(false);
    }
  };

  const stopRecording = () => {
    if (modeRef.current === "live") {
      const r = liveRefs.current;
      if (r !== null) {
        r.processor.disconnect();
        r.source.disconnect();
        r.chunkController.close();
        void r.context.close();
        r.stream.getTracks().forEach((t) => t.stop());
        liveRefs.current = null;
      }
    } else if (recorderRef.current !== null && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
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
