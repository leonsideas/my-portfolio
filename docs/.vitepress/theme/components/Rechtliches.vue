<template>
  <section class="rechtliches-page" :aria-label="text('Impressum und Datenschutz', 'Legal notice and privacy')">
    <div v-if="!isEnglish" class="rechtliches-inner">
      <h1>Impressum</h1>

      <p><strong>Angaben gemäß § 5 TMG</strong></p>

      <p>Leon Albers</p>

      <p><strong>Kontakt</strong><br />
        E-Mail: <a href="mailto:leon-albers@web.de">leon-albers@web.de</a>
      </p>

      <p>
        <strong>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV</strong><br />
        Leon Albers
      </p>

      <p>
        Diese Website dient der privaten Präsentation meiner gestalterischen Arbeiten und Projekte.
        Sie verfolgt keine kommerziellen Zwecke und stellt kein Angebot für den Abschluss von Verträgen
        oder die Erbringung von Leistungen dar.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
        allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als Diensteanbieter jedoch
        nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
        Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss
        habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte
        der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
        Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
        außerhalb der Grenzen des Urheberrechtes bedürfen meiner schriftlichen Zustimmung.
      </p>

      <p>
        Schafaufnahme: „Sheep bleating“ von earthcalling, bearbeiteter Ausschnitt von Dcoetzee,
        gemeinfrei. <a href="https://commons.wikimedia.org/wiki/File:Sheep_bleating.ogg" target="_blank" rel="noopener noreferrer">Quelle und Lizenz</a>.
        Der optionale Deichklang wird erst nach dem Einschalten geladen und lokal abgespielt.
      </p>

      <hr />

      <h1>Datenschutzerklärung</h1>

      <h2>1. Allgemeines</h2>
      <p>
        Diese Website wird als privates Portfolio betrieben. Es werden keine Cookies gesetzt, kein
        Tracking und keine Analyse-Tools eingesetzt. Die Nutzung ist ohne Angabe personenbezogener
        Daten möglich.
      </p>

      <h2>2. Hosting</h2>
      <p>
        Diese Website wird über <strong>GitHub Pages</strong> gehostet. Anbieter ist die GitHub Inc.,
        88 Colin P Kelly Jr St, San Francisco, CA 94107, USA.
      </p>
      <p>
        Beim Aufruf der Seiten werden durch GitHub technisch notwendige Server-Logfiles erhoben
        (u. a. IP-Adresse, Datum/Uhrzeit, angefragte Ressource, Browser-Typ). Diese Daten werden von
        GitHub zur Bereitstellung und Sicherheit des Dienstes verarbeitet. Details:
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >GitHub Privacy Statement</a>.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren
        Bereitstellung der Website).
      </p>

      <h2>3. Kontaktaufnahme</h2>
      <p>
        Wenn du mir eine E-Mail schreibst, werden die von dir angegebenen Daten (E-Mail-Adresse, Name,
        Nachricht) ausschließlich zur Bearbeitung der Anfrage verwendet und nicht an Dritte
        weitergegeben. Eine Löschung erfolgt, sobald die Anfrage erledigt ist und keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </p>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO.</p>

      <h2>4. Externe Links</h2>
      <p>
        Diese Website enthält Links zu externen Angeboten (z. B. Instagram). Für deren Inhalte und
        Datenschutzpraxis sind ausschließlich die jeweiligen Betreiber verantwortlich.
      </p>

      <h2>5. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerspruch. Zudem besteht ein Beschwerderecht bei der zuständigen
        Aufsichtsbehörde (in Bremen: Die Landesbeauftragte für Datenschutz und Informationsfreiheit
        der Freien Hansestadt Bremen).
      </p>
      <p>
        Für alle Anfragen kannst du dich per E-Mail an mich wenden:
        <a href="mailto:leon-albers@web.de">leon-albers@web.de</a>
      </p>

      <hr />

      <p class="rechtliches-back">
        <a :href="homeHref">← Zurück zur Startseite</a>
      </p>
    </div>
    <div v-else class="rechtliches-inner">
      <h1>Legal notice</h1>
      <p><strong>Information pursuant to section 5 TMG</strong></p>
      <p>Leon Albers</p>
      <p><strong>Contact</strong><br />Email: <a href="mailto:leon-albers@web.de">leon-albers@web.de</a></p>
      <p><strong>Responsible for content pursuant to section 55(2) RStV</strong><br />Leon Albers</p>
      <p>This website is a private presentation of my design work and projects. It has no commercial purpose and does not constitute an offer to enter into contracts or provide services.</p>
      <h2>Liability for content</h2>
      <p>As a service provider, I am responsible for my own content on these pages under general law in accordance with section 7(1) TMG. Under sections 8 to 10 TMG, however, I am not obliged to monitor third-party information that is transmitted or stored, or to investigate circumstances indicating unlawful activity.</p>
      <h2>Liability for links</h2>
      <p>This website contains links to external third-party websites over whose content I have no control. I therefore cannot accept responsibility for that content. The respective provider or operator is responsible for the content of linked pages.</p>
      <h2>Copyright</h2>
      <p>The content and works I have created on this website are subject to German copyright law. Reproduction, editing, distribution or use beyond the limits of copyright law requires my written permission.</p>
      <p>Sheep recording: “Sheep bleating” by earthcalling, excerpted by Dcoetzee, released into the public domain. <a href="https://commons.wikimedia.org/wiki/File:Sheep_bleating.ogg" target="_blank" rel="noopener noreferrer">Source and licence</a>. The optional dike sound is loaded and played locally only after it is enabled.</p>
      <hr />
      <h1>Privacy policy</h1>
      <h2>1. General information</h2>
      <p>This website is a private portfolio. It sets no cookies and uses no tracking or analytics tools. You can use it without providing personal information.</p>
      <h2>2. Hosting</h2>
      <p>This website is hosted on <strong>GitHub Pages</strong>, provided by GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA.</p>
      <p>When you visit the website, GitHub collects technically necessary server logs, including your IP address, date and time, requested resource and browser type. GitHub processes this data to provide and secure the service. Details: <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.</p>
      <p>Legal basis: Article 6(1)(f) GDPR, the legitimate interest in providing a secure website.</p>
      <h2>3. Contact by email</h2>
      <p>If you email me, the information you provide, including your email address, name and message, is used only to respond to your enquiry and is not shared with third parties. It is deleted once the enquiry has been resolved and no statutory retention obligations apply.</p>
      <p>Legal basis: Article 6(1)(b) or (f) GDPR.</p>
      <h2>4. External links</h2>
      <p>This website contains links to external services, such as Instagram. Their respective operators are solely responsible for their content and privacy practices.</p>
      <h2>5. Your rights</h2>
      <p>You have the right to access, rectification, erasure, restriction of processing, data portability and objection. You may also lodge a complaint with the competent supervisory authority: in Bremen, the State Commissioner for Data Protection and Freedom of Information of the Free Hanseatic City of Bremen.</p>
      <p>For any enquiries, please email <a href="mailto:leon-albers@web.de">leon-albers@web.de</a>.</p>
      <hr />
      <p class="rechtliches-back"><a :href="homeHref">← Back to the homepage</a></p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watchEffect, onBeforeUnmount } from 'vue'
import { useSiteLanguage } from '../composables/useSiteLanguage'

const { text, isEnglish, localizedPath } = useSiteLanguage()
const homeHref = computed(() => localizedPath('/'))

const previousTitle = typeof document !== 'undefined' ? document.title : ''

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.title = text('Impressum & Datenschutz', 'Legal notice & privacy') + ' – Leon Albers'
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.title = previousTitle
  }
})
</script>

<style scoped>
.rechtliches-page {
  position: fixed;
  inset: 0;
  background: var(--page-bg);
  color: var(--brand-red);
  padding: clamp(96px, calc(14 * var(--site-vh)), 160px) clamp(20px, calc(6 * var(--site-vw)), 48px) clamp(40px, calc(8 * var(--site-vh)), 80px);
  font-family: var(--font-sans, system-ui, sans-serif);
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  z-index: 0;
}

/* Solider Streifen in der Seitenfarbe hinter der NavBar, damit Scroll-Text dahinter
   verschwindet (NavBar selbst ist transparent). z-index < NavBar (30), > Text. */
.rechtliches-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: clamp(72px, calc(11 * var(--site-vh)), 120px);
  background: var(--page-bg);
  z-index: 2;
  pointer-events: none;
}

.rechtliches-inner {
  position: relative;
  z-index: 1;
  max-width: 40rem;
  margin: 0 auto;
  font-size: 0.95rem;
  line-height: 1.65;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.rechtliches-inner h1 {
  font-family: var(--font-heading, "Playfair Display"), Georgia, serif;
  font-style: italic;
  font-weight: 600;
  font-size: clamp(2rem, calc(6 * var(--site-vw)), 3rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--brand-red);
  margin: 2.5rem 0 1.25rem;
}

.rechtliches-inner h1:first-of-type {
  margin-top: 0;
}

.rechtliches-inner h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--brand-red);
  letter-spacing: 0.02em;
  margin: 2rem 0 0.5rem;
}

.rechtliches-inner p {
  margin: 0.75rem 0;
  color: var(--brand-red);
}

.rechtliches-inner a {
  color: var(--brand-red);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--brand-red) 50%, transparent);
  text-underline-offset: 3px;
  transition: text-decoration-color 200ms ease;
}

.rechtliches-inner a:hover,
.rechtliches-inner a:focus-visible {
  text-decoration-color: var(--brand-red);
  outline: none;
}

.rechtliches-inner strong {
  color: var(--brand-red);
  font-weight: 600;
}

.rechtliches-inner hr {
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--brand-red) 25%, transparent);
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
  color: var(--brand-red);
  text-decoration: none;
}

.rechtliches-back a:hover {
  color: var(--brand-red);
}

</style>
