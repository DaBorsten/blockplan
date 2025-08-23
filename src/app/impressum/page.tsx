export const metadata = { title: "Impressum | Blockplan" };

export default function Impressum() {
  return (
    <main className="p-6 mx-auto max-w-3xl">
      <article className="prose dark:prose-invert">
        <h1>Impressum</h1>

        <h2>Anbieter</h2>
        <p>Boas Rautmann</p>
        <p>Hötzendorf 27A</p>
        <p>94104 Tittling</p>
        <p>Deutschland</p>

        <h2>Kontakt</h2>
        <p>
          E-Mail-Adresse:{" "}
          <a href="mailto:boas.rautmann@gmail.com">boas.rautmann@gmail.com</a>
        </p>
        <p>Telefon: +49 157 52626531</p>
      </article>
    </main>
  );
}
