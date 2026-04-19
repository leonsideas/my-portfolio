---
title: Impressum & Datenschutz – Leon Albers
layout: empty
head:
  - - meta
    - name: robots
      content: noindex
---

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

const previousTitle = typeof document !== 'undefined' ? document.title : ''

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.title = 'Impressum & Datenschutz – Leon Albers'
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.title = previousTitle
  }
})
</script>

<div class="rechtliches-page">
  <div class="rechtliches-inner">

<div class="rechtliches-notice">
  <strong>Hinweis:</strong> Dies ist ein vorläufiger Entwurf. Die Anschrift ist noch ein Platzhalter und muss vor der Veröffentlichung durch eine ladungsfähige Anschrift ersetzt werden.
</div>

# Impressum

**Angaben gemäß § 5 TMG**

Leon Albers
Musterstraße 1
28195 Bremen
Deutschland

**Kontakt**
E-Mail: [leon-albers@web.de](mailto:leon-albers@web.de)

**Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV**
Leon Albers (Anschrift wie oben)

Diese Website dient der privaten Präsentation meiner gestalterischen Arbeiten und Projekte. Sie verfolgt keine kommerziellen Zwecke und stellt kein Angebot für den Abschluss von Verträgen oder die Erbringung von Leistungen dar.

**Haftung für Inhalte**
Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.

**Haftung für Links**
Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.

**Urheberrecht**
Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen meiner schriftlichen Zustimmung.

---

# Datenschutzerklärung

## 1. Allgemeines

Diese Website wird als privates Portfolio betrieben. Es werden keine Cookies gesetzt, kein Tracking und keine Analyse-Tools eingesetzt. Die Nutzung ist ohne Angabe personenbezogener Daten möglich.

## 2. Hosting

Diese Website wird über **GitHub Pages** gehostet. Anbieter ist die GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA.

Beim Aufruf der Seiten werden durch GitHub technisch notwendige Server-Logfiles erhoben (u. a. IP-Adresse, Datum/Uhrzeit, angefragte Ressource, Browser-Typ). Diese Daten werden von GitHub zur Bereitstellung und Sicherheit des Dienstes verarbeitet. Details: [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren Bereitstellung der Website).

## 3. Kontaktaufnahme

Wenn du mir eine E-Mail schreibst, werden die von dir angegebenen Daten (E-Mail-Adresse, Name, Nachricht) ausschließlich zur Bearbeitung der Anfrage verwendet und nicht an Dritte weitergegeben. Eine Löschung erfolgt, sobald die Anfrage erledigt ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

Rechtsgrundlage: Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO.

## 4. Externe Links

Diese Website enthält Links zu externen Angeboten (z. B. Instagram). Für deren Inhalte und Datenschutzpraxis sind ausschließlich die jeweiligen Betreiber verantwortlich.

## 5. Deine Rechte

Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Zudem besteht ein Beschwerderecht bei der zuständigen Aufsichtsbehörde (in Bremen: Die Landesbeauftragte für Datenschutz und Informationsfreiheit der Freien Hansestadt Bremen).

Für alle Anfragen kannst du dich per E-Mail an mich wenden: [leon-albers@web.de](mailto:leon-albers@web.de)

---

<p class="rechtliches-back">
  <a href="./">← Zurück zur Startseite</a>
</p>

  </div>
</div>

<style>
.rechtliches-page {
  position: fixed;
  inset: 0;
  background: #000;
  color: rgba(255, 255, 255, 0.88);
  padding: clamp(96px, 14vh, 160px) clamp(20px, 6vw, 48px) clamp(40px, 8vh, 80px);
  font-family: var(--font-sans, system-ui, sans-serif);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.rechtliches-inner {
  max-width: 40rem;
  margin: 0 auto;
  font-size: 0.95rem;
  line-height: 1.65;
}

.rechtliches-inner h1 {
  font-family: var(--font-heading, "Playfair Display"), Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: clamp(2rem, 6vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 2.5rem 0 1.25rem;
}

.rechtliches-inner h1:first-child {
  margin-top: 0;
}

.rechtliches-inner h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.02em;
  margin: 2rem 0 0.5rem;
}

.rechtliches-inner p {
  margin: 0.75rem 0;
  color: rgba(255, 255, 255, 0.8);
}

.rechtliches-inner a {
  color: #fff;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.4);
  text-underline-offset: 3px;
  transition: text-decoration-color 200ms ease;
}

.rechtliches-inner a:hover,
.rechtliches-inner a:focus-visible {
  text-decoration-color: #fff;
  outline: none;
}

.rechtliches-inner strong {
  color: #fff;
  font-weight: 600;
}

.rechtliches-inner hr {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  margin: 2.5rem 0;
}

.rechtliches-back {
  margin-top: 3rem;
  text-align: center;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.rechtliches-back a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
}

.rechtliches-back a:hover {
  color: #fff;
}

.rechtliches-notice {
  border: 1px solid rgba(239, 114, 52, 0.5);
  background: rgba(239, 114, 52, 0.12);
  color: rgba(255, 214, 189, 0.95);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  margin-bottom: 2.5rem;
  font-size: 0.85rem;
  line-height: 1.5;
}

.rechtliches-notice strong {
  color: #ffbe99;
  font-weight: 600;
}
</style>
