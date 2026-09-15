import { IntakeChat } from "@/components/intake-chat";
import { HeroText } from "@/components/site-chrome-text";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="hero">
        <div className="relative z-10 px-6 py-10 md:px-10 md:py-14">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.35em] text-white/80">
            sunte hain · likhte hain · ladte hain
          </p>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <HeroText />
            <p className="font-display text-sm font-semibold uppercase leading-relaxed tracking-wide text-white/85 md:text-right">
              Teri shikayat. Hamara saboot.
              <br />
              Focus se lado. Akele nahi.
            </p>
          </div>
        </div>
      </section>
      <IntakeChat />
    </div>
  );
}
