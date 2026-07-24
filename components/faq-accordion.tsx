import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { FaqSection, FaqTable } from "@/lib/faq-data";

function Table({ table, cs }: { table: FaqTable; cs: boolean }) {
  const headers = cs ? table.headers.cs : table.headers.en;
  return (
    <div className="faq-table-wrap">
      <table className="faq-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.labelEn}>
              <th scope="row">{cs ? row.labelCs : row.labelEn}</th>
              {(cs ? row.valuesCs : row.valuesEn).map((v, i) => <td key={i}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FaqAccordion({ sections, locale }: { sections: FaqSection[]; locale: Locale }) {
  const cs = locale === "cs";
  return (
    <div className="faq-sections">
      {sections.map((section) => (
        <div className="faq-section" key={section.id}>
          <h2>{cs ? section.titleCs : section.titleEn}</h2>
          <div className="faq-list">
            {section.items.map((item) => (
              <details className="faq-item" key={item.id}>
                <summary>
                  <span>{cs ? item.qCs : item.qEn}</span>
                  <ChevronDown className="faq-icon" size={20} />
                </summary>
                <div className="faq-answer">
                  {item.table ? <Table table={item.table} cs={cs} /> : <p>{cs ? item.aCs : item.aEn}</p>}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
