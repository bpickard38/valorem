import Experience from "@/experience/Experience";

/*
 * The cinematic journey. Narrative copy below is SSR'd for SEO/reader modes;
 * the visual versions of these lines live in the Overlay layer.
 */
export default function Home() {
  return (
    <>
      <Experience />
      <section className="sr-only">
        <h1>VALOREM — Fragrance, in its most permanent form.</h1>
        <p>
          Solid cologne and perfume in a twist-up capsule. Carried, not
          sprayed. Enter the House of Valorem: Collection № 1 — The Pantheon.
        </p>
        <ul>
          <li>
            <a href="/product/aphrodite">Aphrodite — rose, vanilla, musk</a>
          </li>
          <li>
            <a href="/product/poseidon">Poseidon — marine, musk, driftwood</a>
          </li>
        </ul>
      </section>
    </>
  );
}
