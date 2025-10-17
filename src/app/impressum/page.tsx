export const metadata = { title: "Impressum | Blockplan" };

export default function Impressum() {
  return (
    <main className="p-6 mx-auto max-w-3xl">
      <article className="prose dark:prose-invert">
        <h1>Impressum</h1>

        <h2>Anbieter</h2>
        <p>
          {process.env.NEXT_PUBLIC_OWNER_NAME}
          <br />
          {process.env.NEXT_PUBLIC_ADDRESS_STREET}
          <br />
          {process.env.NEXT_PUBLIC_ADDRESS_CITY}
          <br />
          {process.env.NEXT_PUBLIC_ADDRESS_COUNTRY}
        </p>

        <h2>Kontakt</h2>
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
      </article>
    </main>
  );
}
