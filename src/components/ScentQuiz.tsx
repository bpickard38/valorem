"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import EmailForm from "@/components/EmailForm";
import { ButtonLink } from "@/components/ui";
import {
  QUIZ,
  optionsFor,
  recommendScent,
  type QuizAnswers,
} from "@/lib/scentQuiz";
import type { ScentId } from "@/lib/shopify";

/*
 * Three questions, then a scent.
 *
 * Client component because every step is local state — nothing here talks to
 * Shopify. The photography, prices and copy it renders were fetched on the
 * server by the home page and handed down as `scents`, so the quiz reuses the
 * same lookups the grid already paid for rather than making its own.
 *
 * The result is NOT gated behind an email. The answer appears the moment the
 * third question is answered, and the email form sits underneath it as a
 * second, optional action. Gating would buy addresses at the cost of the
 * click that actually matters, at the one moment intent is highest.
 */

export interface QuizScent {
  id: ScentId;
  title: string;
  house: string;
  lead: string;
  description: string;
  teaser: string;
  price: string;
  image: { url: string; altText: string | null } | null;
}

export default function ScentQuiz({
  scents,
  sampleGift,
  frameClass,
  imageClass,
}: {
  scents: QuizScent[];
  /* The two-free-samples promise, passed in so the wording stays identical to
   * the hero's. It is a hand-packing promise, not a cart line — see SIZES in
   * site.ts before making it sound like an item. */
  sampleGift: string;
  /* Photography treatment is a cutout/bleed decision made in site.ts. Passed
   * down rather than imported so this component never hardcodes a fit. */
  frameClass: string;
  imageClass: string;
}) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [step, setStep] = useState(0);

  const question = QUIZ[step];
  const done = step >= QUIZ.length;
  const result = done
    ? scents.find((s) => s.id === recommendScent(answers))
    : undefined;

  function choose(optionId: string) {
    setAnswers((prev) => {
      /* Drop every answer AFTER this one. Question 2 branches on question 1,
       * so going Back and switching houses would otherwise leave a Gods family
       * answer sitting in state while the Goddesses options are on screen —
       * scored against a branch it does not belong to. Clearing forward is
       * correct for any branching quiz and costs nothing when nothing changed. */
      const kept: QuizAnswers = {};
      for (const q of QUIZ.slice(0, step)) {
        if (prev[q.id]) kept[q.id] = prev[q.id];
      }
      return { ...kept, [question.id]: optionId };
    });
    setStep((s) => s + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  /* Guard, not a fallback worth designing: `scents` is built from the same
   * catalogue recommendScent() picks from, so a miss means the two have
   * drifted. Restarting is better than rendering an empty result card. */
  if (done && !result) {
    return (
      <div className="text-center">
        <p className="text-sm text-charcoal/70">
          Something went wrong finding that scent.
        </p>
        <button
          type="button"
          onClick={restart}
          className="mt-4 text-xs uppercase tracking-[0.25em] text-gold-deep underline-offset-8 hover:underline"
        >
          Start over
        </button>
      </div>
    );
  }

  if (done && result) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="label-engraved text-center text-charcoal/50">
          Start Here
        </p>
        <h3 className="type-heading mt-5 text-center text-charcoal">
          Start with {result.title}.
        </h3>

        <div className="mt-10 grid items-center gap-8 sm:grid-cols-2 sm:gap-10">
          <div className={`relative aspect-[4/5] w-full ${frameClass}`}>
            {result.image ? (
              <Image
                src={result.image.url}
                alt={result.image.altText ?? result.title}
                fill
                sizes="(min-width: 640px) 320px, 100vw"
                className={imageClass}
              />
            ) : null}
          </div>

          <div className="text-center sm:text-left">
            <p className="label-engraved text-gold-deep">{result.house}</p>
            <p className="mt-3 font-serif text-xl italic text-charcoal/75">
              {result.lead}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/70">
              {result.description}
            </p>
            <p className="mt-4 font-serif text-sm italic leading-snug text-charcoal/60">
              {result.teaser}
            </p>
            <div className="mt-7">
              <ButtonLink href={`/product/${result.id}`}>
                See {result.title} — from {result.price}
              </ButtonLink>
            </div>
            <p className="mt-5 text-xs leading-relaxed tracking-wide text-charcoal/55">
              {sampleGift}
            </p>
          </div>
        </div>

        {/* Both secondary actions sit ABOVE the email capture, directly under
            the recommendation they refer to. They were below it until
            2026-08-05, which put a form between the answer and the two ways of
            questioning it — someone unconvinced by their result had to scroll
            past a signup to retake the quiz or go look at the other five.

            Kept as quiet text rather than filled buttons on purpose: the one
            loud control on this screen is "See {scent}", and giving "Take it
            again" the same weight would invite a reader to re-roll instead of
            act on an answer they were just given. */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={restart}
            className="cursor-pointer text-xs uppercase tracking-[0.25em] text-charcoal/50 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
          >
            Take it again
          </button>
          <Link
            href="/collections"
            className="text-xs uppercase tracking-[0.25em] text-charcoal/50 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
          >
            See all six
          </Link>
        </div>

        <div className="mt-12 border-t border-charcoal/10 pt-10 text-center">
          <p className="font-serif text-lg text-charcoal">
            Want the other five in writing?
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal/65">
            One email. All six scents, described honestly, including who each
            one is wrong for.
          </p>
          <div className="mt-8">
            <EmailForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress as words, not a bar — three steps is short enough that
          "Question 1 of 3" is more reassuring than a sliver of gold. */}
      <p className="label-engraved text-center text-charcoal/45">
        Question {step + 1} of {QUIZ.length}
      </p>
      <h3 className="mt-5 text-center font-serif text-2xl leading-snug text-charcoal sm:text-3xl">
        {question.prompt}
      </h3>

      <div className="mt-10 flex flex-col gap-3">
        {optionsFor(question, answers).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            className="group cursor-pointer border border-charcoal/15 bg-ivory px-6 py-5 text-left transition-colors duration-200 hover:border-gold hover:bg-gold/[0.06]"
          >
            <span className="block font-serif text-lg text-charcoal transition-colors group-hover:text-gold-deep">
              {option.label}
            </span>
            <span className="mt-1 block text-xs tracking-wide text-charcoal/55">
              {option.hint}
            </span>
          </button>
        ))}
      </div>

      {step > 0 ? (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="cursor-pointer text-xs uppercase tracking-[0.25em] text-charcoal/50 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
          >
            ← Back
          </button>
        </div>
      ) : null}
    </div>
  );
}
