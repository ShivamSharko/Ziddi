"use client";

import { useEffect, useState } from "react";
import { EyeOff } from "lucide-react";
import { AadhaarOtp } from "./aadhaar-otp";
import { VoiceIntake } from "./voice-intake";
import { useLang } from "./language-provider";
import { ComboInput } from "./location-fields";
import { cityOptions, localitiesForCity, stateForCity } from "@ziddi/domain";

type Step = "idle" | "thinking" | "success" | "error";

interface FestivalTrigger {
  season: string;
  label: string;
  kinds: string[];
  suggestion: string;
}

interface DuplicateCase {
  id: string;
  summary: string;
  votes: number;
  locality: string | null;
  city: string;
}

interface VoiceExtraction {
  transcript: string;
  kind: string;
  summary: string;
  city: string;
  state: string;
  urgency: string;
  amountRupees?: number;
}

export function IntakeChat() {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [anonymous, setAnonymous] = useState(false);
  const [triggers, setTriggers] = useState<FestivalTrigger[]>([]);
  const [verifiedAadhaar, setVerifiedAadhaar] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCase[] | null>(null);
  const [voiceExtraction, setVoiceExtraction] = useState<VoiceExtraction | null>(null);
  const [result, setResult] = useState<{ caseId?: string; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/festivals")
      .then((r) => r.json())
      .then((data) => setTriggers(data.triggers ?? []))
      .catch(() => setTriggers([]));
  }, []);

  const submit = async (forceNew: boolean) => {
    if (verifiedAadhaar === null) {
      setResult({ error: "Pehle Aadhaar + OTP verification complete karo" });
      setStep("error");
      return;
    }
    setStep("thinking");
    setResult(null);
    setDuplicates(null);

    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawCitizenText: text,
          anonymous,
          aadhaar: verifiedAadhaar,
          locality,
          city,
          state,
          forceNew,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setDuplicates(data.duplicates ?? []);
        setStep("idle");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to start case");
      }
      setResult({ caseId: data.caseId });
      setStep("success");
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Unknown error" });
      setStep("error");
    }
  };

  const supportCase = async (id: string) => {
    if (verifiedAadhaar === null) return;
    setStep("thinking");
    setResult(null);
    try {
      const res = await fetch(`/api/cases/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar: verifiedAadhaar }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Upvote failed");
      }
      setResult({ caseId: id });
      setStep("success");
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Unknown error" });
      setStep("error");
    }
  };

  const handleVoiceExtraction = (data: VoiceExtraction) => {
    setVoiceExtraction(data);
    setText(data.summary);
  };

  const activeTrigger = triggers[0];

  return (
    <div className="crop-frame dim space-y-5 p-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-[var(--moss)]" style={{ clipPath: "url(#petal4)" }} aria-hidden />
        <div>
          <p className="font-display text-sm font-bold">Ziddi Bot</p>
          <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--text-2)]">
            Batao kya hua — I&apos;ll take it from here
          </p>
        </div>
      </div>

      {activeTrigger !== undefined && (
        <div className="space-y-1 border-l-2 border-[var(--ember)] pl-3">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--ember)]">
            {activeTrigger.season} watch
          </p>
          <p className="text-sm text-[var(--text-2)]">{activeTrigger.suggestion}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
        className="space-y-4"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("intake.placeholder")}
          className="field-underline h-28 resize-none"
          disabled={step === "thinking"}
        />
        <div className="flex flex-wrap items-end gap-4">
          <ComboInput
            options={cityOptions()}
            value={city}
            onChange={(v) => {
              setCity(v);
              const s = stateForCity(v);
              if (s !== undefined) setState(s);
            }}
            placeholder="City (e.g. Bengaluru)"
          />
          {state.length > 0 && (
            <span className="pb-2 font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--signal)]">
              {state}
            </span>
          )}
        </div>
        <ComboInput
          options={localitiesForCity(city).map((l) => ({ value: l }))}
          value={locality}
          onChange={setLocality}
          placeholder={t("intake.locality")}
        />

        <AadhaarOtp verified={verifiedAadhaar !== null} onVerified={(a) => setVerifiedAadhaar(a)} />

        <VoiceIntake onExtraction={handleVoiceExtraction} />

        {voiceExtraction !== null && (
          <div className="crop-frame space-y-1 p-3">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--moss)]">
              Voice extracted
            </p>
            <p className="text-xs text-[var(--text-2)]">
              <span className="font-mono-data">{voiceExtraction.kind}</span> · {voiceExtraction.city},{" "}
              {voiceExtraction.state} · {voiceExtraction.urgency}
              {voiceExtraction.amountRupees !== undefined ? ` · ₹${voiceExtraction.amountRupees}` : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                setVoiceExtraction(null);
                setText("");
              }}
              className="font-mono-data text-[10px] text-[var(--text-2)] underline"
            >
              clear &amp; type manually
            </button>
          </div>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={anonymous}
          onClick={() => setAnonymous(!anonymous)}
          className="flex items-center gap-3"
        >
          <span className={`switch ${anonymous ? "on" : ""}`}>
            <span className="knob" />
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
            <EyeOff size={14} /> Anonymous mode — naam shared documents mein hide rahega
          </span>
        </button>

        <div className="flex items-center justify-between gap-4">
          <p className="font-mono-data text-[10px] text-[var(--text-2)]">
            {step === "thinking" ? t("intake.analyzing") : t("intake.idle")}
          </p>
          <button
            type="submit"
            disabled={step === "thinking" || !text.trim() || verifiedAadhaar === null}
            className="rounded-full bg-[var(--ember)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === "thinking" ? t("intake.thinking") : t("intake.submit")}
          </button>
        </div>
      </form>

      {duplicates !== null && duplicates.length > 0 && (
        <div className="crop-frame ember space-y-3 p-4">
          <p className="font-display text-sm font-bold">
            Same case, same location already exists — community power ikattha karo:
          </p>
          <ul className="space-y-2">
            {duplicates.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-xs text-[var(--text-2)]">
                <span className="truncate">
                  {d.summary}
                  {d.locality !== null ? ` · ${d.locality}` : ""} · {d.votes} votes
                </span>
                <button
                  type="button"
                  onClick={() => void supportCase(d.id)}
                  className="shrink-0 rounded-full bg-[var(--rosewood)] px-3 py-1.5 text-xs font-semibold text-[#2a1a1c]"
                >
                  Support
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void submit(true)}
            className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--signal)] underline"
          >
            Naya case file karna hai anyway? Click here
          </button>
        </div>
      )}

      {result !== null && (
        <div className={`fade-up mosaic-reveal crop-frame p-4 ${result.error !== undefined ? "ember" : ""}`}>
          {result.caseId !== undefined && (
            <>
              <p className="font-display text-sm font-bold text-[var(--moss)]">Case created / supported.</p>
              <p className="mt-1 font-mono-data text-[10px] text-[var(--text-2)]">CASE #{result.caseId}</p>
              <a
                href={`/cases/${result.caseId}`}
                className="mt-2 inline-block text-sm text-[var(--signal)] underline"
              >
                View case →
              </a>
            </>
          )}
          {result.error !== undefined && <p className="text-sm text-[var(--ember)]">{result.error}</p>}
        </div>
      )}
    </div>
  );
}
