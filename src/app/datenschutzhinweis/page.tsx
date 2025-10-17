import { headers } from "next/headers";
import Link from "next/link";

export const metadata = { title: "Datenschutzerklärung | Blockplan" };
export default async function PrivacyPolicyPage() {
  const headersList = headers();
  const host = (await headersList).get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const IMPRESSUM_URL = `${baseUrl}/impressum`;

  return (
    <main className="p-6 mx-auto max-w-3xl space-y-6">
      <article className="prose dark:prose-invert">
        <h1>Datenschutzerklärung</h1>
        <p>Stand: 19. September 2025</p>
        <h2>Inhaltsübersicht</h2>
        <ul>
          <li>
            <a href="#i1">Verantwortlicher</a>
          </li>
          <li>
            <a href="#i2">Allgemeines zur Datenverarbeitung</a>
          </li>
          <li>
            <a href="#i3">Hosting (Vercel)</a>
          </li>
          <li>
            <a href="#i4">Nutzerkonto & Authentifizierung (Clerk)</a>
          </li>
          <li>
            <a href="#i5">Datenbank (Convex)</a>
          </li>
          <li>
            <a href="#i6">
              Verarbeitung hochgeladener Stundenpläne (Google Cloud)
            </a>
          </li>
          <li>
            <a href="#i7">Cookies</a>
          </li>
          <li>
            <a href="#i8">Dauer der Speicherung</a>
          </li>
          <li>
            <a href="#i9">Rechte der betroffenen Personen</a>
          </li>
          <li>
            <a href="#i10">Datensicherheit</a>
          </li>
          <li>
            <a href="#i11">Beschwerderecht</a>
          </li>
        </ul>
        <div id="i1">
          <h2>Verantwortlicher</h2>
          <p>
            {process.env.NEXT_PUBLIC_OWNER_NAME}
            <br />
            {process.env.NEXT_PUBLIC_ADDRESS_STREET}
            <br />
            {process.env.NEXT_PUBLIC_ADDRESS_CITY}
            <br />
            {process.env.NEXT_PUBLIC_ADDRESS_COUNTRY}
          </p>
          <p>
            E-Mail-Adresse:{" "}
            <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL_ADDRESS}`}>
              {process.env.NEXT_PUBLIC_EMAIL_ADDRESS}
            </a>
            <br></br>
            Telefon:{" "}
            <a href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}>
              {process.env.NEXT_PUBLIC_PHONE_NUMBER_DISPLAY}
            </a>
          </p>
          <p>
            Impressum:{" "}
            <a href={IMPRESSUM_URL} target="_blank">
              {IMPRESSUM_URL}
            </a>
          </p>
        </div>

        <div id="i2">
          <h2>Allgemeines zur Datenverarbeitung</h2>
          <p>
            Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich
            nur, soweit dies zur Bereitstellung einer funktionsfähigen Website
            sowie unserer Inhalte und Leistungen erforderlich ist.
          </p>

          <p className="font-bold">Rechtsgrundlagen nach Art. 6 DSGVO:</p>
          <ul>
            <li>
              Art. 6 Abs. 1 lit. b DSGVO: Vertragserfüllung (z. B. Nutzerkonto,
              Speicherung hochgeladener Stundenpläne)
            </li>
            <li>
              Art. 6 Abs. 1 lit. f DSGVO: Berechtigtes Interesse (z. B.
              IT-Sicherheit, Hosting)
            </li>
          </ul>
        </div>

        <div id="i3">
          <h2>Hosting (Vercel)</h2>
          <p>Unsere Website wird bei Vercel Inc. gehostet.</p>
          <p>
            Vercel Inc.<br></br>440 N Barranca Ave<br></br>Suite 4133<br></br>
            Covina<br></br>CA 91723<br></br>United States
          </p>

          <p>Vercel verarbeitet beim Besuch der Website insbesondere:</p>

          <ul>
            <li>IP-Adresse des Besuchers</li>
            <li>technische Logdaten</li>
          </ul>
          <p>
            <strong>Rechtsgrundlage: </strong>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem und
            effizientem Betrieb der Website).
          </p>

          <p>
            Mit Vercel besteht ein{" "}
            <Link href="https://vercel.com/legal/dpa">
              Auftragsverarbeitungsvertrag
            </Link>{" "}
            (Art. 28 DSGVO).
          </p>
        </div>

        <div id="i4">
          <h2>Nutzerkonto & Authentifizierung (Clerk)</h2>
          <p>Wir nutzen den Dienst Clerk für Registrierung und Login.</p>
          <p>
            Clerk, Inc.<br></br>660 King Street<br></br>Unit 345<br></br>
            San Francisco<br></br>CA 94107<br></br>United States
          </p>

          <p>Dabei verarbeitet Clerk:</p>

          <ul>
            <li>E-Mail-Adresse und ggf. weitere Login-Daten</li>
            <li>technische Cookies (für die Anmeldung erforderlich)</li>
          </ul>

          <p>
            Zusätzlich bieten wir die Möglichkeit, sich per Single Sign-On (SSO)
            über Drittanbieter anzumelden:
          </p>

          <ul>
            <li>
              Google:{" "}
              <Link href={"https://policies.google.com/privacy"}>
                https://policies.google.com/privacy
              </Link>
            </li>
            <li>
              GitHub{" "}
              <Link
                href={"https://docs.github.com/en/site-policy/privacy-policies"}
              >
                https://docs.github.com/en/site-policy/privacy-policies
              </Link>
            </li>
          </ul>

          <p>
            Wenn Sie die Anmeldung über Google oder GitHub wählen, werden die
            dafür erforderlichen Daten (z. B. Name, E-Mail-Adresse) von diesen
            Anbietern an Clerk übermittelt.
          </p>

          <p>
            <strong>Rechtsgrundlagen: </strong>
          </p>
          <ul>
            <li>
              Art. 6 Abs. 1 lit. b DSGVO (Nutzung des Nutzerkontos, Nutzung des
              SSO-Logins, Vertragserfüllung)
            </li>
            <li>
              Art. 6 Abs. 1 lit. f DSGVO (Sicherheit, Missbrauchsverhinderung)
            </li>
          </ul>

          <p>
            <strong>Hinweis zur Drittlandübermittlung: </strong>
          </p>
          <ul>
            <li>
              Bei Google kann ein Zugriff durch die Google LLC (USA) erfolgen.
              Rechtsgrundlage sind die EU-Standardvertragsklauseln (SCCs).
            </li>
            <li>
              Bei GitHub kann ein Zugriff in die USA erfolgen. Auch hier werden
              die Standardvertragsklauseln (SCCs) verwendet.
            </li>
          </ul>

          <p>
            Mit Clerk besteht ein{" "}
            <Link href="https://clerk.com/legal/dpa">
              Auftragsverarbeitungsvertrag
            </Link>{" "}
            (Art. 28 DSGVO). Clerk speichert notwendige Cookies im Browser, die
            nicht abwählbar sind.
          </p>
        </div>

        <div id="i5">
          <h2>Datenbank (Convex)</h2>
          <p>
            Wir speichern Nutzerdaten (z. B. hochgeladene Stundenpläne,
            Metadaten) in einer Convex-Datenbank.
          </p>

          <p>
            Convex Systems, Inc.<br></br>548 Market St<br></br>PMB 73135
            <br></br>San Francisco<br></br>CA 94104-5401<br></br>United States
          </p>

          <p>
            <strong>Hinweis zur Drittlandübermittlung: </strong>
            Da Convex seinen Sitz in den USA hat, erfolgt eine Übermittlung
            personenbezogener Daten in ein Drittland außerhalb der EU/EWR. Um
            ein angemessenes Datenschutzniveau sicherzustellen, werden die
            EU-Standardvertragsklauseln (SCCs) verwendet.
          </p>

          <p>
            <strong>Rechtsgrundlage: </strong>
            Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>

          <p>
            Mit Convex besteht ein{" "}
            <Link href="https://www.convex.dev/legal/dpa">
              Auftragsverarbeitungsvertrag
            </Link>{" "}
            (Art. 28 DSGVO).
          </p>
        </div>

        <div id="i6">
          <h2>Verarbeitung hochgeladener Stundenpläne (Google Cloud)</h2>
          <p>
            Hochgeladene PDF-Stundenpläne werden temporär an einen
            Python-Service in Google Cloud Run übermittelt und unmittelbar nach
            der Datenextraktion gelöscht.<br></br>Die Verarbeitung erfolgt in
            einem Rechenzentrum in der Region europe-west1 (Belgien).
          </p>
          <p>
            <strong>Hinweis zur Drittlandübermittlung: </strong>
            Google LLC (USA) kann als Muttergesellschaft theoretisch Zugriff auf
            Daten haben. Hierfür werden die EU-Standardvertragsklauseln (SCCs)
            verwendet, um ein angemessenes Datenschutzniveau sicherzustellen.
          </p>
          <p>
            <strong>Rechtsgrundlage: </strong>
            Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Verarbeitung im
            Auftrag nach Art. 28 DSGVO.
          </p>

          <p>
            Mit Google Cloud besteht ein{" "}
            <Link href="https://cloud.google.com/terms/data-processing-addendum">
              Auftragsverarbeitungsvertrag
            </Link>{" "}
            (Art. 28 DSGVO).
          </p>
        </div>

        <div id="i7">
          <h2>Cookies</h2>
          <p>
            Wir setzen ausschließlich technisch notwendige Cookies ein: Es
            erfolgt <strong>kein Tracking zu Marketingzwecken.</strong>
            <br></br>
            Diese Cookies sind für die Funktionalität der Website unerlässlich
            und können nicht deaktiviert werden.
          </p>
          <ul>
            <li>
              Session-Cookies von Clerk (Speicherdauer: bis Logout/Session-Ende)
            </li>
            <li>Sicherheits-Cookies (Speicherdauer: Session)</li>
          </ul>
          <p>
            Es erfolgt <strong>kein Tracking zu Marketingzwecken.</strong>
          </p>
          <p>
            <strong>Rechtsgrundlage: </strong>
            Art. 6 Abs. 1 lit. b DSGVO (erforderlich für die Nutzung des Kontos)
            und Art. 6 Abs. 1 lit. f DSGVO (Sicherheit).
          </p>
        </div>

        <div id="i8">
          <h2>Dauer der Speicherung</h2>
          <ul>
            <li>
              Daten im Nutzerkonto bleiben gespeichert, bis das Konto gelöscht
              wird.
            </li>
            <li>
              Hochgeladene Stundenpläne werden gelöscht, sobald der Nutzer sie
              entfernt oder das Konto löscht.
            </li>
            <li>
              In Google Cloud Run werden die Stundenpläne nicht persistent
              gespeichert.
            </li>
            <li>Vercel Runtime-Logs werden nach 3 Tagen gelöscht</li>
          </ul>
        </div>

        <div id="i9">
          <h2>Rechte der betroffenen Personen</h2>
          <p>Sie haben folgende Rechte nach der DSGVO:</p>
          <ul>
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p>
            Zur Ausübung Ihrer Rechte können Sie uns jederzeit unter den oben
            genannten Kontaktdaten kontaktieren.
          </p>
        </div>

        <div id="i10">
          <h2>Datensicherheit</h2>
          <p>
            Unsere Website nutzt TLS-Verschlüsselung. Zudem setzen wir
            technische und organisatorische Maßnahmen ein, um Ihre Daten
            bestmöglich zu schützen.
          </p>
        </div>

        <div id="i11">
          <h2>Beschwerderecht</h2>
          <p>
            Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu
            beschweren, insbesondere in dem EU-Mitgliedstaat Ihres
            Aufenthaltsorts oder Arbeitsorts.
          </p>
          <p>
            Für Deutschland sind dies die jeweiligen
            Landesdatenschutzbeauftragten.
          </p>
        </div>

        <hr></hr>

        <p>
          Ergänzend zur DSGVO gilt für Deutschland das Bundesdatenschutzgesetz
          (BDSG), das insbesondere spezielle Regelungen für Beschäftigtendaten
          (§ 26 BDSG) sowie Befugnisse der Aufsichtsbehörden enthält.
        </p>
      </article>
    </main>
  );
}
