"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { ArrowRight, Check, Download, Info, RotateCcw, Sparkles } from "lucide-react";
import { getProductName } from "@/lib/data";
import { pdfFontBold, pdfFontNormal } from "@/lib/pdf-font";
import type { CombinationResult, ConfigInput, MetricKey, PositionPreference, PrimaryFocus } from "@/lib/recommender";
import { countNoun, nounMachines, type Locale } from "@/lib/i18n";

type FormState = {
  budgetCzk: number;
  exchangeRate: number;
  machineCount: "auto" | number;
  spaceA: number;
  spaceB: number;
  availableSpace: number;
  existingWorkout: boolean;
  bodyweight: boolean;
  weightlifting: boolean;
  cardioStretching: boolean;
  kids: boolean;
  boxingBag: boolean;
  wheelchair: boolean;
  primaryFocus: PrimaryFocus;
  position: PositionPreference;
  balanceSpecialised: number;
  publicPrivate: number;
  costUse: number;
  resultCount: number;
};

const DEFAULTS: FormState = {
  budgetCzk: 500000,
  exchangeRate: 25,
  machineCount: "auto",
  spaceA: 5,
  spaceB: 5,
  availableSpace: 25,
  existingWorkout: false,
  bodyweight: false,
  weightlifting: true,
  cardioStretching: false,
  kids: false,
  boxingBag: false,
  wheelchair: false,
  primaryFocus: "full",
  position: "any",
  balanceSpecialised: 3,
  publicPrivate: 3,
  costUse: 3,
  resultCount: 5,
};

const LINES: { slug: string; en: string; cs: string }[] = [
  { slug: "standard-line", en: "Standard", cs: "Standard" },
  { slug: "light-line", en: "Light", cs: "Light" },
  { slug: "pro-line", en: "Pro", cs: "Pro" },
  { slug: "plus-line", en: "Plus", cs: "Plus" },
  { slug: "workout-line", en: "Workout", cs: "Workout" },
  { slug: "cardio-line", en: "Cardio", cs: "Cardio" },
  { slug: "gymnastics-line", en: "Gymnastics", cs: "Gymnastika" },
  { slug: "boxing-line", en: "Boxing", cs: "Box" },
  { slug: "kids-line", en: "Kids", cs: "Děti" },
];

function deriveLines(s: FormState): string[] {
  if (s.wheelchair) return ["plus-line"];
  const set = new Set<string>();
  if (s.weightlifting) {
    set.add("standard-line");
    set.add("light-line");
    if (s.costUse >= 4) {
      set.add("pro-line");
      set.add("plus-line");
    }
  }
  if (s.bodyweight && !s.existingWorkout) set.add("workout-line");
  if (s.cardioStretching) {
    set.add("cardio-line");
    set.add("gymnastics-line");
  }
  if (s.kids) set.add("kids-line");
  if (s.boxingBag) set.add("boxing-line");
  if (s.position === "seated") {
    set.delete("standard-line");
    set.delete("pro-line");
    if (s.weightlifting) {
      set.add("light-line");
      set.add("plus-line");
    }
  }
  return [...set];
}

const metricLabels: Record<Locale, Record<MetricKey, string>> = {
  en: { coverage: "Body coverage", focusFit: "Focus fit", value: "Value for money", space: "Space efficiency" },
  cs: { coverage: "Zapojení těla", focusFit: "Zaměření", value: "Poměr cena/užitek", space: "Úspora prostoru" },
};

const sliderLabels = {
  balanceSpecialised: { en: ["Balanced", "No preference", "Specialised"], cs: ["Vyvážené", "Bez preference", "Specializované"] },
  publicPrivate: { en: ["Public", "No preference", "Private"], cs: ["Veřejné", "Bez preference", "Soukromé"] },
  costUse: { en: ["As cheap as possible", "No preference", "No limit"], cs: ["Co nejlevněji", "Bez preference", "Bez limitu"] },
} as const;

function YesNo({ id, label, value, onChange, pulseId, cs }: { id: string; label: string; value: boolean; onChange: (v: boolean) => void; pulseId: string; cs: boolean }) {
  return (
    <div className={`choice-group ${pulseId === id ? "pulse" : ""}`} id={id}>
      <span>{label}</span>
      <div className="choice-row">
        <button className={value ? "selected" : ""} onClick={() => onChange(true)}>{cs ? "Ano" : "Yes"}</button>
        <button className={!value ? "selected" : ""} onClick={() => onChange(false)}>{cs ? "Ne" : "No"}</button>
      </div>
    </div>
  );
}

function Slider({ id, value, onChange, labels, pulseId }: { id: string; value: number; onChange: (v: number) => void; labels: readonly string[]; pulseId: string }) {
  return (
    <div className={`slider-item ${pulseId === id ? "pulse" : ""}`} id={id}>
      <input type="range" min="1" max="5" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="slider-labels"><span>{labels[0]}</span><span>{labels[1]}</span><span>{labels[2]}</span></div>
    </div>
  );
}

export function Configurator({ locale }: { locale: Locale }) {
  const cs = locale === "cs";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [rateSource, setRateSource] = useState<"cnb" | "fallback" | "manual" | "loading">("loading");
  const [pulse, setPulse] = useState<string>("");
  const [resultsVisible, setResultsVisible] = useState(false);
  const [results, setResults] = useState<CombinationResult[]>([]);
  const [accessState, setAccessState] = useState<"loading" | "locked" | "ready">("loading");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    fetch("/api/access").then((r) => r.json()).then((d) => setAccessState(d.authenticated ? "ready" : "locked")).catch(() => setAccessState("locked"));
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.rate === "number") setForm((f) => ({ ...f, exchangeRate: d.rate }));
        setRateSource(d.source === "cnb" ? "cnb" : "fallback");
      })
      .catch(() => setRateSource("fallback"));
  }, []);

  const includedLines = deriveLines(form);
  const included = new Set(includedLines);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setResultsVisible(false);
    setResults([]);
  };
  const triggerPulse = (id: string) => {
    setPulse(id);
    setTimeout(() => setPulse((p) => (p === id ? "" : p)), 650);
  };

  // Clicking a category chip flips the answer that controls its line, and pulses that question.
  const toggleChip = (slug: string) => {
    setResultsVisible(false);
    setResults([]);
    setForm((f) => {
      switch (slug) {
        case "standard-line":
        case "light-line":
          triggerPulse("q-weightlifting");
          return { ...f, weightlifting: !f.weightlifting };
        case "pro-line":
        case "plus-line":
          triggerPulse("q-cost");
          return { ...f, costUse: f.costUse >= 4 ? 3 : 4 };
        case "workout-line":
          triggerPulse("q-bodyweight");
          return { ...f, bodyweight: !f.bodyweight };
        case "cardio-line":
        case "gymnastics-line":
          triggerPulse("q-cardio");
          return { ...f, cardioStretching: !f.cardioStretching };
        case "kids-line":
          triggerPulse("q-kids");
          return { ...f, kids: !f.kids };
        case "boxing-line":
          triggerPulse("q-boxing");
          return { ...f, boxingBag: !f.boxingBag };
        default:
          return f;
      }
    });
  };

  const setSpace = (a: number, b: number) => update("availableSpace", Math.round(a * b * 10) / 10);

  const generate = async () => {
    setIsGenerating(true);
    setGenerationError("");
    const input: ConfigInput = {
      budgetCzk: form.budgetCzk,
      exchangeRate: form.exchangeRate,
      machineCount: form.machineCount,
      availableSpace: form.availableSpace,
      includedLines,
      existingWorkout: form.existingWorkout,
      primaryFocus: form.primaryFocus,
      position: form.position,
      wheelchair: form.wheelchair,
      balanceSpecialised: form.balanceSpecialised,
      publicPrivate: form.publicPrivate,
      costUse: form.costUse,
      resultCount: form.resultCount,
    };
    try {
      const response = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, locale }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recommendation failed.");
      setResults(data.results as CombinationResult[]);
      setResultsVisible(true);
      setStep(4);
      setTimeout(() => document.getElementById("configuration-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Recommendation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    setAccessError("");
    const response = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: accessCode }) });
    const data = await response.json();
    if (!response.ok) { setAccessError(data.error || (cs ? "Neplatný přístupový kód." : "Invalid access code.")); return; }
    setAccessState("ready");
  };

  const downloadPdf = (resultIndex: number) => {
    const result = results[resultIndex];
    if (!result) return;
    const doc = new jsPDF();
    doc.addFileToVFS("DejaVuSans.ttf", pdfFontNormal);
    doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", pdfFontBold);
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
    doc.setFont("DejaVu", "bold"); doc.setFontSize(20); doc.text(cs ? "Doporučená sestava Street Barbell" : "Recommended Street Barbell configuration", 18, 22);
    doc.setFont("DejaVu", "normal"); doc.setFontSize(10); doc.text("streetbarbell.cz  |  export@rvl13.com  |  +420 721 443 652", 18, 30);
    doc.setDrawColor(210); doc.line(18, 35, 192, 35);
    doc.setFontSize(12);
    doc.text(`${cs ? "Odhad ceny sestavy (bez DPH)" : "Estimated equipment price (excl. VAT)"}: ${Math.round(result.totalCzk).toLocaleString()} CZK / ≈ €${Math.round(result.totalEur).toLocaleString()}`, 18, 45);
    doc.text(`${cs ? "Skóre doporučení" : "Recommendation score"}: ${result.score.toFixed(1)} / 10`, 18, 53);
    doc.setFont("DejaVu", "bold"); doc.text(cs ? "Stroje" : "Machines", 18, 66);
    doc.setFont("DejaVu", "normal");
    let y = 75;
    result.products.forEach((product, i) => { doc.text(`${i + 1}. ${product.code} — ${getProductName(product)}`, 22, y); y += 8; });
    y += 5; doc.setFont("DejaVu", "bold"); doc.text(cs ? "Proč tato sestava" : "Why this setup", 18, y); y += 8;
    doc.setFont("DejaVu", "normal");
    const purpose = doc.splitTextToSize(result.purpose, 170); doc.text(purpose, 18, y); y += purpose.length * 6 + 3;
    result.strengths.forEach((s) => { const t = doc.splitTextToSize(`• ${s}`, 170); doc.text(t, 18, y); y += t.length * 6; });
    const weakness = doc.splitTextToSize(`${cs ? "Kompromis" : "Trade-off"}: ${result.weakness}`, 170); y += 3; doc.text(weakness, 18, y);
    doc.save(`street-barbell-configuration-${resultIndex + 1}.pdf`);
  };

  const reset = () => { setForm({ ...DEFAULTS, exchangeRate: form.exchangeRate }); setResultsVisible(false); setResults([]); setStep(1); };

  if (accessState === "loading") return <div className="config-access loading"><span className="eyebrow">Street Barbell Distributor Tool</span><h2>{cs ? "Ověřuji přístup…" : "Checking access…"}</h2></div>;

  if (accessState === "locked") return (
    <div className="config-access">
      <div className="access-icon"><Sparkles size={28} /></div>
      <span className="eyebrow">Street Barbell Distributor Tool</span>
      <h2>{cs ? "Konfigurátor je určen distributorům" : "Distributor access required"}</h2>
      <p>{cs ? "Zadejte přístupový kód. Ceny a obchodní logika zůstávají mimo veřejný GitHub repozitář." : "Enter your access code. Pricing and commercial logic remain protected from the public GitHub repository."}</p>
      <form onSubmit={unlock}><input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder={cs ? "Přístupový kód" : "Access code"} autoFocus /><button className="button button-red" type="submit">{cs ? "Odemknout konfigurátor" : "Unlock configurator"}<ArrowRight size={18} /></button></form>
      {accessError && <p className="access-error">{accessError}</p>}
      <small>{cs ? "Přístupový kód poskytuje exportní tým RVL13." : "Access codes are provided by the RVL13 export team."}</small>
    </div>
  );

  return (
    <div className="configurator-shell">
      <div className="config-progress">
        {[1, 2, 3, 4].map((n) => <button key={n} className={step >= n ? "active" : ""} onClick={() => setStep(n)}><span>{step > n ? <Check size={15} /> : n}</span><small>{[cs ? "Rozsah" : "Scope", cs ? "Zadání" : "Brief", cs ? "Priority" : "Priorities", cs ? "Výsledky" : "Results"][n - 1]}</small></button>)}
      </div>

      {/* Category bar — reflects (and drives) which product lines are in the search. */}
      <div className="category-bar">
        {LINES.map((line) => (
          <button key={line.slug} className={`cat-chip ${included.has(line.slug) ? "on" : ""}`} onClick={() => toggleChip(line.slug)}>
            {cs ? line.cs : line.en}
          </button>
        ))}
      </div>

      <section className={step === 1 ? "config-step active" : "config-step"}>
        <div className="config-step-heading"><span>01</span><div><h2>{cs ? "Rozpočet a prostor" : "Budget and space"}</h2><p>{cs ? "Rozpočet je pevný filtr. Pokud zvolíte počet strojů, rozpočet se ignoruje." : "Budget is a hard filter. If you choose a machine count, the budget is ignored."}</p></div></div>
        <div className="field-grid three-columns">
          <label><span>{cs ? "Celkový rozpočet (CZK)" : "Total budget (CZK)"}</span><input type="number" min="10000" step="10000" value={form.budgetCzk} disabled={form.machineCount !== "auto"} onChange={(e) => update("budgetCzk", Number(e.target.value))} /></label>
          <label><span>{cs ? "Kurz CZK / EUR (ČNB)" : "CZK / EUR rate (CNB)"}</span><input type="number" min="1" step="0.001" value={form.exchangeRate} onChange={(e) => { update("exchangeRate", Number(e.target.value)); setRateSource("manual"); }} /></label>
          <label><span>{cs ? "Počet strojů" : "Machine count"}</span><select value={form.machineCount} onChange={(e) => update("machineCount", e.target.value === "auto" ? "auto" : Number(e.target.value))}><option value="auto">{cs ? "Automaticky (dle rozpočtu)" : "Auto (from budget)"}</option>{[1, 2, 3, 4, 5, 6].map((n) => <option value={n} key={n}>{n}</option>)}</select></label>
        </div>
        <div className="field-grid space-row">
          <label><span>{cs ? "Šířka (m)" : "Width (m)"}</span><input type="number" min="0" step="0.1" value={form.spaceA} onChange={(e) => { const a = Number(e.target.value); setForm((f) => ({ ...f, spaceA: a })); setSpace(a, form.spaceB); }} /></label>
          <span className="space-times">×</span>
          <label><span>{cs ? "Délka (m)" : "Length (m)"}</span><input type="number" min="0" step="0.1" value={form.spaceB} onChange={(e) => { const b = Number(e.target.value); setForm((f) => ({ ...f, spaceB: b })); setSpace(form.spaceA, b); }} /></label>
          <span className="space-times">=</span>
          <label><span>{cs ? "Plocha (m²)" : "Space (m²)"}</span><input type="number" min="0" step="0.1" value={form.availableSpace} onChange={(e) => update("availableSpace", Number(e.target.value))} /></label>
        </div>
        <div className="budget-summary"><Info size={18} /><p>{form.machineCount === "auto" ? (cs ? `Ceník 2026 bez DPH. Kurz ${rateSource === "cnb" ? "z ČNB" : rateSource === "manual" ? "ručně" : "orientační"}. Ceny nezahrnují dopravu, instalaci, beton ani dopadovou plochu.` : `2026 pricelist, excl. VAT. Rate ${rateSource === "cnb" ? "from CNB" : rateSource === "manual" ? "manual" : "indicative"}. Prices exclude freight, installation, concrete works and safety surfacing.`) : (cs ? "Pevný počet strojů — rozpočet se ignoruje, cena se přesto zobrazí." : "Fixed machine count — budget ignored, price still shown.")}</p></div>
        <div className="config-next"><button className="button button-red" onClick={() => setStep(2)}>{cs ? "Pokračovat" : "Continue"} <ArrowRight size={18} /></button></div>
      </section>

      <section className={step === 2 ? "config-step active" : "config-step"}>
        <div className="config-step-heading"><span>02</span><div><h2>{cs ? "Tréninkové zadání" : "Training brief"}</h2><p>{cs ? "Odpovědi níže rozhodují, které produktové řady se objeví v horní liště." : "The answers below decide which product lines light up in the bar above."}</p></div></div>
        <div className="brief-grid">
          <YesNo id="q-existing" cs={cs} pulseId={pulse} label={cs ? "Je už na místě workoutová konstrukce?" : "Is there already a workout structure?"} value={form.existingWorkout} onChange={(v) => update("existingWorkout", v)} />
          <YesNo id="q-bodyweight" cs={cs} pulseId={pulse} label={cs ? "Přidat cvičení s vlastní vahou (workout)?" : "Add bodyweight (calisthenics) training?"} value={form.bodyweight} onChange={(v) => update("bodyweight", v)} />
          <YesNo id="q-weightlifting" cs={cs} pulseId={pulse} label={cs ? "Silový trénink se zátěží?" : "Weightlifting training?"} value={form.weightlifting} onChange={(v) => update("weightlifting", v)} />
          <YesNo id="q-cardio" cs={cs} pulseId={pulse} label={cs ? "Kardio a strečink?" : "Cardio & stretching?"} value={form.cardioStretching} onChange={(v) => update("cardioStretching", v)} />
          <YesNo id="q-kids" cs={cs} pulseId={pulse} label={cs ? "Dětské prvky?" : "Kids equipment?"} value={form.kids} onChange={(v) => update("kids", v)} />
          <YesNo id="q-boxing" cs={cs} pulseId={pulse} label={cs ? "Zahrnout boxovací pytel?" : "Include a boxing bag?"} value={form.boxingBag} onChange={(v) => update("boxingBag", v)} />
          <YesNo id="q-wheelchair" cs={cs} pulseId={pulse} label={cs ? "Přístupné pro vozíčkáře?" : "Wheelchair accessible?"} value={form.wheelchair} onChange={(v) => update("wheelchair", v)} />
          <label className="brief-select"><span>{cs ? "Hlavní zaměření" : "Primary focus"}</span><select value={form.primaryFocus} onChange={(e) => update("primaryFocus", e.target.value as PrimaryFocus)}><option value="full">{cs ? "Celé tělo" : "Full body"}</option><option value="upper">{cs ? "Horní část" : "Upper body"}</option><option value="lower">{cs ? "Dolní část" : "Lower body"}</option></select></label>
          <label className="brief-select"><span>{cs ? "Preferovaná poloha" : "Position preference"}</span><select value={form.position} onChange={(e) => update("position", e.target.value as PositionPreference)}><option value="any">{cs ? "Nezáleží" : "Doesn't matter"}</option><option value="seated">{cs ? "Vsedě" : "Seated"}</option><option value="standing">{cs ? "Ve stoje" : "Standing"}</option></select></label>
        </div>
        <div className="config-next"><button className="button button-light" onClick={() => setStep(1)}>{cs ? "Zpět" : "Back"}</button><button className="button button-red" onClick={() => setStep(3)}>{cs ? "Nastavit priority" : "Set priorities"} <ArrowRight size={18} /></button></div>
      </section>

      <section className={step === 3 ? "config-step active" : "config-step"}>
        <div className="config-step-heading"><span>03</span><div><h2>{cs ? "Priority" : "Priorities"}</h2><p>{cs ? "Střed (3) znamená bez preference. Posuňte jen to, na čem záleží." : "The middle (3) means no preference. Move only what matters."}</p></div></div>
        <div className="slider-grid">
          <div className="slider-block"><h3>{cs ? "Zapojení těla" : "Body coverage"}</h3><Slider id="s-balance" pulseId={pulse} value={form.balanceSpecialised} onChange={(v) => update("balanceSpecialised", v)} labels={sliderLabels.balanceSpecialised[locale]} /></div>
          <div className="slider-block"><h3>{cs ? "Umístění" : "Installation"}</h3><Slider id="s-public" pulseId={pulse} value={form.publicPrivate} onChange={(v) => update("publicPrivate", v)} labels={sliderLabels.publicPrivate[locale]} /></div>
          <div className="slider-block"><h3>{cs ? "Cena a využití" : "Cost and use"}</h3><Slider id="q-cost" pulseId={pulse} value={form.costUse} onChange={(v) => update("costUse", v)} labels={sliderLabels.costUse[locale]} /></div>
          <label className="brief-select"><span>{cs ? "Počet zobrazených sestav" : "Recommendations to show"}</span><select value={form.resultCount} onChange={(e) => update("resultCount", Number(e.target.value))}>{[3, 5, 8, 10].map((v) => <option key={v}>{v}</option>)}</select></label>
        </div>
        <div className="config-next"><button className="button button-light" onClick={() => setStep(2)}>{cs ? "Zpět" : "Back"}</button><button className="button button-red" disabled={isGenerating || includedLines.length === 0} onClick={generate}><Sparkles size={18} /> {isGenerating ? (cs ? "Počítám…" : "Calculating…") : (cs ? "Vygenerovat sestavy" : "Generate configurations")}</button></div>
        {includedLines.length === 0 && <p className="generation-error">{cs ? "Vyberte alespoň jednu produktovou řadu v horní liště." : "Select at least one product line in the bar above."}</p>}
      </section>

      {generationError && <p className="generation-error">{generationError}</p>}

      {resultsVisible && (
        <section id="configuration-results" className="config-results">
          <div className="results-heading"><div><span className="eyebrow">{cs ? "Výsledek" : "Recommendation result"}</span><h2>{results.length ? (cs ? `${results.length} doporučených sestav` : `${results.length} recommended configurations`) : (cs ? "Nebyla nalezena vhodná sestava" : "No feasible configuration found")}</h2></div><button className="icon-button" onClick={reset}><RotateCcw size={18} /> {cs ? "Začít znovu" : "Start over"}</button></div>
          <div className="result-list">
            {results.map((result, index) => (
              <article className="result-card" key={result.id}>
                <div className="result-rank"><span>#{index + 1}</span><strong>{result.score.toFixed(1)}</strong><small>/ 10</small></div>
                <div className="result-content">
                  <div className="result-title-row"><div><small>{result.products.length} {countNoun(result.products.length, locale, nounMachines)}</small><h3>{result.products.map((p) => getProductName(p)).join(" + ")}</h3></div><div className="result-price"><small>{cs ? "Odhad ceny" : "Estimated price"}</small><strong>{Math.round(result.totalCzk).toLocaleString()} CZK</strong><span>≈ €{Math.round(result.totalEur).toLocaleString()}</span></div></div>
                  <p className="result-purpose">{result.purpose}</p>
                  <div className="result-products">{result.products.map((product) => <Link key={product.code} href={`/${locale}/products/${product.lineSlug}/${product.slug}`}><span>{product.code}</span><strong>{getProductName(product)}</strong><small>{product.bodyFocus}</small></Link>)}</div>
                  <div className="metric-bars">{(Object.entries(result.metrics) as [MetricKey, number][]).map(([key, value]) => <div key={key}><span>{metricLabels[locale][key]}</span><i><b style={{ width: `${value * 10}%` }} /></i><strong>{value.toFixed(1)}</strong></div>)}</div>
                  <div className="result-notes"><div>{result.strengths.map((strength) => <p key={strength}><Check size={16} /> {strength}</p>)}</div><p className="weakness"><Info size={16} /> {result.weakness}</p></div>
                  <div className="result-footer"><span>{result.footprint ? `${cs ? "Přibližná plocha strojů" : "Approx. machine footprint"}: ${result.footprint.toFixed(1)} m²` : (cs ? "Pro část strojů chybí rozměrová data." : "Some machine footprint data is unavailable.")}</span><button className="button button-dark button-small" onClick={() => downloadPdf(index)}><Download size={17} /> PDF</button></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
