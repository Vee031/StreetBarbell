import { MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function FloatingWhatsApp({ locale }: { locale: Locale }) {
  const text = locale === "cs"
    ? "Dobrý den, mám zájem o sestavu Street Barbell a rád/a bych získal/a více informací."
    : "Hello, I am interested in a Street Barbell setup and would like more information.";
  return (
    <a className="floating-wa" href={`https://wa.me/420721443652?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">
      <MessageCircle size={23} />
    </a>
  );
}
