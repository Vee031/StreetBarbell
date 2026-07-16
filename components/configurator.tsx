"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { ArrowRight, Check, Download, Info, RotateCcw, Sparkles } from "lucide-react";
import { getProductName, type PriceKey } from "@/lib/data";
import { pdfFontBold, pdfFontNormal } from "@/lib/pdf-font";
import type { CombinationResult, ConfigInput, Focus, PositionPreference, Priorities, PriorityKey, SpecializationMode } from "@/lib/recommender";
import { countNoun, nounMachines, type Locale } from "@/lib/i18n";

const defaultPriorities: Priorities = {
  balance: 5,
  specialization: 2,
  variety: 4,
  beginner: 3,
  accessibility: 1,
  throughput: 1,
  space: 1,
  complement: 1,
  value: 2,
};

const priorityLabels = {
  en: {
    balance: "Balanced body coverage", specialization: "Body-part specialization", variety: "Exercise variety",
    beginner: "Beginner / public suitability", accessibility: "Accessibility", throughput: "Simultaneous users",
    space: "Space efficiency", complement: "Complement workout structure", value: "Value for money",
  },
  cs: {
    balance: "Vyvážené zapojení těla", specialization: "Specializace na část těla", variety: "Variabilita cviků",
    beginner: "Vhodnost pro začátečníky", accessibility: "Přístupnost", throughput: "Více uživatelů současně",
    space: "Úspora prostoru", complement: "Doplnění workoutové konstrukce", value: "Poměr ceny a užitku",
  },
} as const;

const priceOptions: { value: PriceKey; en: string; cs: string }[] = [
  { value: "pcDiscount", en: "Powder coating — distributor price", cs: "Práškový lak — distributorská cena" },
  { value: "tcDiscount", en: "Thermoplastic coating — distributor price", cs: "Termoplast — distributorská cena" },
  { value: "hdgDiscount", en: "Hot-dip galvanised — distributor price", cs: "Žárový zinek — distributorská cena" },
  { value: "pcBase", en: "Powder coating — list price", cs: "Práškový lak — ceníková cena" },
  { value: "tcBase", en: "Thermoplastic coating — list price", cs: "Termoplast — ceníková cena" },
  { value: "hdgBase", en: "Hot-dip galvanised — list price", cs: "Žárový zinek — ceníková cena" },
];

export function Configurator({ locale }: { locale: Locale }) {
  const cs = locale === "cs";
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<ConfigInput>({
    budgetCzk: 250000,
    exchangeRate: 25,
    reservePercent: 0,
    priceKey: "pcBase",
    existingWorkout: false,
    focus: "Full Body",
    sport: "General Public",
    position: "Doesn't matter",
    strictPosition: false,
    machineCount: "auto",
    resultCount: 5,
    specializationMode: "Balanced",
    priorities: defaultPriorities,
  });
  const [resultsVisible, setResultsVisible] = useState(false);
  const [results, setResults] = useState<CombinationResult[]>([]);
  const [accessState, setAccessState] = useState<"loading" | "locked" | "ready">("loading");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    fetch("/api/access").then((response) => response.json()).then((data) => setAccessState(data.authenticated ? "ready" : "locked")).catch(() => setAccessState("locked"));
  }, []);

  const totalPoints = Object.values(input.priorities).reduce((a, b) => a + b, 0);
  const budgetEur = input.budgetCzk / input.exchangeRate * (1 - input.reservePercent / 100);

  const update = <K extends keyof ConfigInput>(key: K, value: ConfigInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setResultsVisible(false);
    setResults([]);
  };
  const updatePriority = (key: PriorityKey, value: number) => update("priorities", { ...input.priorities, [key]: value });

  const generate = async () => {
    if (totalPoints !== 20) return;
    setIsGenerating(true);
    setGenerationError("");
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
    // jsPDF core fonts cannot render Czech diacritics — register a Unicode font first.
    doc.addFileToVFS("DejaVuSans.ttf", pdfFontNormal);
    doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", pdfFontBold);
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
    const title = cs ? "Doporučená sestava Street Barbell" : "Recommended Street Barbell configuration";
    doc.setFont("DejaVu", "bold"); doc.setFontSize(20); doc.text(title, 18, 22);
    doc.setFont("DejaVu", "normal"); doc.setFontSize(10); doc.text(`streetbarbell.cz  |  export@rvl13.com  |  +420 721 443 652`, 18, 30);
    doc.setDrawColor(210); doc.line(18, 35, 192, 35);
    doc.setFontSize(12); doc.text(`${cs ? "Rozpočet" : "Budget"}: ${Math.round(input.budgetCzk).toLocaleString()} CZK`, 18, 45);
    doc.text(`${cs ? "Odhad ceny sestavy" : "Estimated equipment price"}: €${Math.round(result.totalEur).toLocaleString()} / ${Math.round(result.totalCzk).toLocaleString()} CZK`, 18, 53);
    doc.text(`${cs ? "Skóre doporučení" : "Recommendation score"}: ${result.score.toFixed(1)} / 10`, 18, 61);
    doc.setFont("DejaVu", "bold"); doc.text(cs ? "Stroje" : "Machines", 18, 74);
    doc.setFont("DejaVu", "normal");
    let y = 83;
    result.products.forEach((product, i) => { doc.text(`${i + 1}. ${product.code} — ${getProductName(product, locale)}`, 22, y); y += 8; });
    y += 5; doc.setFont("DejaVu", "bold"); doc.text(cs ? "Proč tato sestava" : "Why this setup", 18, y); y += 8;
    doc.setFont("DejaVu", "normal");
    const purpose = doc.splitTextToSize(result.purpose, 170); doc.text(purpose, 18, y); y += purpose.length * 6 + 3;
    result.strengths.forEach((s) => { const text = doc.splitTextToSize(`• ${s}`, 170); doc.text(text, 18, y); y += text.length * 6; });
    const weakness = doc.splitTextToSize(`${cs ? "Kompromis" : "Trade-off"}: ${result.weakness}`, 170); y += 3; doc.text(weakness, 18, y);
    doc.save(`street-barbell-configuration-${resultIndex + 1}.pdf`);
  };

  const reset = () => {
    setInput({ ...input, priorities: defaultPriorities, budgetCzk: 250000, focus: "Full Body", machineCount: "auto", existingWorkout: false, position: "Doesn't matter", strictPosition: false, specializationMode: "Balanced" });
    setResultsVisible(false); setResults([]); setStep(1);
  };

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
        {[1, 2, 3, 4].map((number) => <button key={number} className={step >= number ? "active" : ""} onClick={() => setStep(number)}><span>{step > number ? <Check size={15} /> : number}</span><small>{[cs ? "Rozpočet" : "Budget", cs ? "Zaměření" : "Training brief", cs ? "Priority" : "Priorities", cs ? "Výsledky" : "Results"][number - 1]}</small></button>)}
      </div>

      <section className={step === 1 ? "config-step active" : "config-step"}>
        <div className="config-step-heading"><span>01</span><div><h2>{cs ? "Rozpočet a rozsah" : "Budget and scope"}</h2><p>{cs ? "Rozpočet je pevný filtr. Počet strojů může být zvolen ručně, nebo vyplynout ze skutečných cen." : "Budget is a hard filter. Machine count can be chosen manually or emerge from actual product prices."}</p></div></div>
        <div className="field-grid three-columns">
          <label><span>{cs ? "Celkový rozpočet (CZK)" : "Total budget (CZK)"}</span><input type="number" min="50000" step="10000" value={input.budgetCzk} onChange={(e) => update("budgetCzk", Number(e.target.value))} /></label>
          <label><span>{cs ? "Kurz CZK / EUR" : "CZK / EUR exchange rate"}</span><input type="number" min="1" step="0.1" value={input.exchangeRate} onChange={(e) => update("exchangeRate", Number(e.target.value))} /></label>
          <label><span>{cs ? "Rezerva mimo vybavení (%)" : "Non-equipment reserve (%)"}</span><input type="number" min="0" max="80" value={input.reservePercent} onChange={(e) => update("reservePercent", Number(e.target.value))} /></label>
          <label className="wide-field"><span>{cs ? "Cenová varianta" : "Price basis"}</span><select value={input.priceKey} onChange={(e) => update("priceKey", e.target.value as PriceKey)}>{priceOptions.map((option) => <option key={option.value} value={option.value}>{cs ? option.cs : option.en}</option>)}</select></label>
          <label><span>{cs ? "Počet strojů" : "Machine count"}</span><select value={input.machineCount} onChange={(e) => update("machineCount", e.target.value === "auto" ? "auto" : Number(e.target.value))}><option value="auto">{cs ? "Automaticky podle rozpočtu" : "Auto from budget"}</option>{[1,2,3,4,5,6].map((n) => <option value={n} key={n}>{n}</option>)}</select></label>
        </div>
        <div className="budget-summary"><div><small>{cs ? "Rozpočet na stroje" : "Equipment budget"}</small><strong>€{Math.round(budgetEur).toLocaleString()}</strong></div><Info size={18} /><p>{cs ? "Cena je orientační a nezahrnuje dopravu, instalaci, beton ani dopadovou plochu." : "Prices are indicative and exclude freight, installation, concrete works and safety surfacing."}</p></div>
        <div className="config-next"><button className="button button-red" onClick={() => setStep(2)}>{cs ? "Pokračovat" : "Continue"} <ArrowRight size={18} /></button></div>
      </section>

      <section className={step === 2 ? "config-step active" : "config-step"}>
        <div className="config-step-heading"><span>02</span><div><h2>{cs ? "Tréninkové zadání" : "Training brief"}</h2><p>{cs ? "Duplicitní pohyb není automaticky chyba. U specializované sestavy může být přesně tím, co klient potřebuje." : "A duplicated movement is not automatically a mistake. In a specialist setup it may be exactly what the client needs."}</p></div></div>
        <div className="choice-group"><span>{cs ? "Je na místě workoutová konstrukce?" : "Is there already a workout structure?"}</span><div className="choice-row"><button className={input.existingWorkout ? "selected" : ""} onClick={() => update("existingWorkout", true)}>{cs ? "Ano" : "Yes"}</button><button className={!input.existingWorkout ? "selected" : ""} onClick={() => update("existingWorkout", false)}>{cs ? "Ne" : "No"}</button></div></div>
        <div className="field-grid two-columns">
          <label><span>{cs ? "Hlavní zaměření" : "Primary focus"}</span><select value={input.focus} onChange={(e) => update("focus", e.target.value as Focus)}>{["Full Body","Upper Body","Lower Body","Core / Posterior Chain","Cardio / Conditioning","Sport-specific"].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>{cs ? "Sport / cílová skupina" : "Sport / use case"}</span><select value={input.sport} onChange={(e) => update("sport", e.target.value)}>{["General Public","Soccer","Strength","Senior / Beginner","Accessible Community","Compact Urban","Custom"].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>{cs ? "Preferovaná poloha" : "Position preference"}</span><select value={input.position} onChange={(e) => update("position", e.target.value as PositionPreference)}>{["Doesn't matter","Standing","Seated","Lying / Bench","Mixed / Multiple","Hanging / Bodyweight"].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>{cs ? "Pravidlo pro polohu" : "Position rule"}</span><select value={input.strictPosition ? "strict" : "soft"} onChange={(e) => update("strictPosition", e.target.value === "strict")}><option value="soft">{cs ? "Měkká preference" : "Soft preference"}</option><option value="strict">{cs ? "Pevný filtr" : "Strict filter"}</option></select></label>
          <label><span>{cs ? "Míra specializace" : "Specialization mode"}</span><select value={input.specializationMode} onChange={(e) => update("specializationMode", e.target.value as SpecializationMode)}>{["Balanced","Focused","Maximum concentration","No preference"].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span>{cs ? "Počet zobrazených sestav" : "Recommendations to show"}</span><select value={input.resultCount} onChange={(e) => update("resultCount", Number(e.target.value))}>{[3,5,8,10].map((v) => <option key={v}>{v}</option>)}</select></label>
        </div>
        <div className="config-next"><button className="button button-light" onClick={() => setStep(1)}>{cs ? "Zpět" : "Back"}</button><button className="button button-red" onClick={() => setStep(3)}>{cs ? "Nastavit priority" : "Set priorities"} <ArrowRight size={18} /></button></div>
      </section>

      <section className={step === 3 ? "config-step active" : "config-step"}>
        <div className="config-step-heading"><span>03</span><div><h2>{cs ? "Rozdělte přesně 20 bodů" : "Allocate exactly 20 points"}</h2><p>{cs ? "Silná priorita má 7–10 bodů. Nula znamená, že daný faktor nemá ovlivnit pořadí sestav." : "A strong priority is 7–10 points. Zero means the factor should not influence the ranking."}</p></div></div>
        <div className="points-status"><strong className={totalPoints === 20 ? "valid" : totalPoints > 20 ? "invalid" : ""}>{totalPoints} / 20</strong><span>{totalPoints === 20 ? (cs ? "Matice je připravena" : "Matrix ready") : totalPoints < 20 ? `${cs ? "Zbývá přidělit" : "Points remaining"}: ${20 - totalPoints}` : `${cs ? "Odeberte" : "Remove"}: ${totalPoints - 20}`}</span></div>
        <div className="priority-grid">
          {(Object.keys(input.priorities) as PriorityKey[]).map((key) => (
            <label className="priority-item" key={key}>
              <div><span>{priorityLabels[locale][key]}</span><strong>{input.priorities[key]}</strong></div>
              <input type="range" min="0" max="10" value={input.priorities[key]} onChange={(e) => updatePriority(key, Number(e.target.value))} />
            </label>
          ))}
        </div>
        <div className="config-next"><button className="button button-light" onClick={() => setStep(2)}>{cs ? "Zpět" : "Back"}</button><button className="button button-red" disabled={totalPoints !== 20 || isGenerating} onClick={generate}><Sparkles size={18} /> {isGenerating ? (cs ? "Počítám sestavy…" : "Calculating…") : (cs ? "Vygenerovat sestavy" : "Generate configurations")}</button></div>
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
                  <div className="result-title-row"><div><small>{result.products.length} {countNoun(result.products.length, locale, nounMachines)}</small><h3>{result.products.map((p) => getProductName(p, locale)).join(" + ")}</h3></div><div className="result-price"><small>{cs ? "Odhad ceny" : "Estimated price"}</small><strong>€{Math.round(result.totalEur).toLocaleString()}</strong><span>{Math.round(result.totalCzk).toLocaleString()} CZK</span></div></div>
                  <p className="result-purpose">{result.purpose}</p>
                  <div className="result-products">{result.products.map((product) => <Link key={product.code} href={`/${locale}/products/${product.lineSlug}/${product.slug}`}><span>{product.code}</span><strong>{getProductName(product, locale)}</strong><small>{product.bodyFocus}</small></Link>)}</div>
                  <div className="metric-bars">{(Object.entries(result.metrics) as [PriorityKey, number][]).filter(([key]) => input.priorities[key] > 0).sort((a,b) => input.priorities[b[0]] - input.priorities[a[0]]).slice(0,5).map(([key,value]) => <div key={key}><span>{priorityLabels[locale][key]}</span><i><b style={{ width: `${value * 10}%` }} /></i><strong>{value.toFixed(1)}</strong></div>)}</div>
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
