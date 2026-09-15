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
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--ink-2)] p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 bg-[var(--moss)]" style={{ clipPath: "url(#petal4)" }} aria-hidden />
          <div className="rounded-bl-sm rounded-br-[14px] rounded-tl-[14px] rounded-tr-[14px] bg-[var(--ink-3)] p-3 px-4 text-[15px]">
            Ziddi Bot — batao kya hua? Hindi, English ya dono mein likh sakte ho.
          </div>
        </div>

        {text.length > 0 && (
          <div className="mb-5 flex justify-end">
            <div className="rounded-bl-[14px] rounded-br-[4px] rounded-tl-[14px] rounded-tr-[14px] bg-[rgba(36,71,245,0.18)] p-3 px-4 text-[15px] max-w-[80%] break-words">
              {text}
            </div>
          </div>
        )}

        {activeTrigger !== undefined && (
          <div className="mb-5 space-y-1 border-l-2 border-[var(--ember)] pl-3">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--ember)]">
              {activeTrigger.season} watch
            </p>
            <p className="text-sm text-[var(--text-2)]">{activeTrigger.suggestion}</p>
          </div>
        )}

        <div className="space-y-4">
          <textarea
            data-testid="grievance-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("intake.placeholder")}
            className="field-underline h-28 resize-none w-full"
            disabled={step === "thinking"}
          />
          <div className="flex flex-wrap items-end gap-4 mt-2">
            <div className="flex-1 min-w-[200px]">
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
            </div>
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
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="crop-frame space-y-5 p-6">
          <p className="font-display text-[15px] font-bold">Verify to file</p>

          <AadhaarOtp verified={verifiedAadhaar !== null} onVerified={(a) => setVerifiedAadhaar(a)} />

          <VoiceIntake onExtraction={handleVoiceExtraction} />

          {voiceExtraction !== null && (
            <div className="crop-frame dim space-y-1 p-3">
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
            className="flex items-center gap-3 mt-4"
          >
            <span className={`switch ${anonymous ? "on" : ""}`}>
              <span className="knob" />
            </span>
            <span className="flex items-center gap-1.5 text-sm text-[var(--text-2)]">
              <EyeOff size={14} /> Anonymous mode — naam chhupa rahega
            </span>
          </button>

          <button
            data-testid="start-case"
            type="button"
            onClick={() => void submit(false)}
            disabled={step === "thinking" || !text.trim() || verifiedAadhaar === null}
            className="mt-6 w-full rounded-full bg-[var(--ember)] px-6 py-[13px] text-[14.5px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === "thinking" ? t("intake.thinking") : "Start My Case"}
          </button>
        </div>

        {duplicates !== null && duplicates.length > 0 && (
          <div data-testid="dup-interstitial" className="crop-frame ember space-y-3 p-4">
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
              data-testid="file-anyway"
              type="button"
              onClick={() => void submit(true)}
              className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--signal)] underline"
            >
              Naya case file karna hai anyway? Click here
            </button>
          </div>
        )}

        {result !== null && (
          <div data-testid="case-created" className={`fade-up mosaic-reveal crop-frame p-4 ${result.error !== undefined ? "ember" : ""}`}>
            {result.caseId !== undefined && (
              <>
                <p className="font-display text-sm font-bold text-[var(--moss)]">Case created / supported.</p>
                <p className="mt-1 font-mono-data text-[10px] text-[var(--text-2)]">CASE #{result.caseId}</p>
                <a
                  data-testid="view-case"
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
    </div>
  );
}
