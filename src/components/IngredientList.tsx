import Link from "next/link";
import Disclosure from "@/components/Disclosure";
import {
  ALCOHOL_NOTE,
  FULL_INGREDIENTS,
  INGREDIENTS,
} from "@/lib/site";

/*
 * Ingredient transparency — three plain-language groups, with the complete
 * list one click away for anyone who wants it.
 *
 * Every ingredient named here is in the Batch 5 formulation sheet (see
 * INGREDIENTS in lib/site.ts). Nothing is inferred from what a solid fragrance
 * "usually" contains, which is how the candelilla and shea in the original
 * brief would have got here — both turned out to be real, but only because the
 * formulation was checked rather than assumed.
 *
 * TWO PHRASES THAT MUST NEVER APPEAR, both settled policy:
 *
 *   "alcohol-free" / "no alcohol" — cetyl alcohol is the largest non-wax solid
 *     in the formula. The claim we make is the narrower true one, "no
 *     denatured alcohol", and ALCOHOL_NOTE renders directly underneath so a
 *     shopper who opens the full list and finds "cetyl alcohol" has already
 *     been told why it is there. That footnote is the load-bearing part of
 *     this component: without it, a true claim sits three lines above a list
 *     that appears to contradict it, and looking evasive costs more than the
 *     claim is worth.
 *
 *   "all natural" — retired and unsubstantiated, and false here besides: the
 *     esters, the isopropyl myristate and the fragrance oil are a large part
 *     of this formula by weight.
 *
 * The full list carries no percentages. Cosmetic ingredient declarations are
 * required in descending order of weight, which FULL_INGREDIENTS is — the
 * grams are the formula and stay in the owner's sheet.
 */
export default function IngredientList({
  className = "",
}: {
  className?: string;
}) {
  return (
    <section aria-labelledby="ingredients-heading" className={className}>
      <div className="mx-auto max-w-xl text-center">
        <p className="label-engraved text-charcoal/50">What&rsquo;s In It</p>
        {/* Does not state a COUNT. "Ten ingredients" was written here first and
            cut: it is true of the current formula and becomes false the moment
            anyone touches FULL_INGREDIENTS, which is exactly the kind of claim
            that rots quietly. */}
        <h2 id="ingredients-heading" className="type-heading mt-5 text-charcoal">
          Every ingredient, listed.
        </h2>
      </div>

      <div className="mx-auto mt-14 grid w-full max-w-5xl gap-10 md:grid-cols-3 md:gap-9">
        {INGREDIENTS.map((group) => (
          <div key={group.title}>
            <h3 className="font-serif text-xl leading-snug text-charcoal">
              {group.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
              {group.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 w-full max-w-3xl">
        {/* The honesty footnote. Sits above the full list rather than below it,
            so it is read BEFORE a shopper finds "cetyl alcohol" in there and
            not as an excuse afterwards. */}
        <p className="border-l-2 border-gold/40 pl-4 text-xs leading-relaxed text-charcoal/55">
          {ALCOHOL_NOTE}
        </p>

        <div className="mt-8">
          <Disclosure title="Full Ingredient List">
            {/* Explicitly labelled as ordered by weight — otherwise a list in
                this order looks arbitrary, and the order is the information. */}
            <p className="mb-4 text-xs uppercase tracking-[0.16em] text-charcoal/45">
              In descending order of weight
            </p>
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {FULL_INGREDIENTS.map((item) => (
                <li key={item.name} className="text-sm text-charcoal/75">
                  {item.name}
                  {item.inci && (
                    <span className="text-charcoal/45"> ({item.inci})</span>
                  )}
                </li>
              ))}
            </ul>
            {/* States the limitation, promises nothing. An earlier draft said
                "ask us and we'll send it" — the allergen breakdown comes from
                the fragrance house per scent and isn't in hand, so that was a
                fulfilment commitment written by a component rather than by the
                person who'd have to honour it. */}
            <p className="mt-5 text-xs leading-relaxed text-charcoal/50">
              The fragrance oil itself differs by scent. Questions about a
              specific one are welcome at{" "}
              <Link
                href="/contact"
                className="text-gold-deep underline-offset-4 hover:underline"
              >
                contact
              </Link>
              .
            </p>
          </Disclosure>
        </div>
      </div>
    </section>
  );
}
