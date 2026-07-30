/*
 * The scent finder — three questions, one recommendation.
 *
 * This exists because "Not sure which one is yours?" was answered by an email
 * capture: a stranger typed an address and waited for an inbox to solve the
 * problem they had right then. The quiz answers it in-session and hands them a
 * product page.
 *
 * WHY THE COPY LIVES HERE AND NOT IN site.ts
 * site.ts is the source of truth for scent copy — names, notes, pyramids,
 * inspiration — and this file writes none of that. It holds question wording
 * and a scoring table, and it references scents only by id. Adding a scent
 * means giving it weights below; changing what a scent smells like is still a
 * site.ts edit and nothing here needs to know.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * No match percentage, no "94% of people like you", no confidence score. The
 * brand has almost no orders, so any number implying a population behind the
 * answer would be invented — the same rule that keeps ReviewProofLine
 * rendering nothing until a real review exists. A recommendation is allowed to
 * be an opinion from the house. It is not allowed to look like data.
 */

import type { ScentId } from "@/lib/shopify";
import { SCENTS } from "@/lib/site";

/* Points an answer adds to each scent. Partial: an option names only the
 * scents it actually argues for, and silence means zero rather than a
 * penalty — every scent should be reachable, none should be punished for
 * failing to match a question it has no opinion about. */
type Weights = Partial<Record<ScentId, number>>;

export interface QuizOption {
  id: string;
  label: string;
  /* One line under the label. Says what the answer means in scent terms
   * without naming a scent, so the result still lands as a reveal. */
  hint: string;
  weights: Weights;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

/* Three questions, not five. Each additional step sheds people, and three is
 * already enough to separate all six — proven by the reachability walk at the
 * bottom of this file.
 *
 * HOW THE QUESTIONS ARE WRITTEN, AND WHY
 *
 * 1. Smells a person already owns. The first question anchors on things
 *    everyone has smelled — cut grapefruit, woodsmoke, clean linen — not on
 *    perfumery vocabulary. Someone who does not know what "ambroxan" or a
 *    "chypre" is can still answer it honestly and instantly, and the answer
 *    still maps cleanly onto the real pyramids in site.ts.
 *
 *    Deliberately NOT anchored on designer fragrances. "Like Bleu de Chanel"
 *    would be the most recognisable option of all, and it is exactly what this
 *    file must not do: it makes a claim about someone else's product, invites
 *    a comparison the formula has never been tested against, and drags the
 *    brand back to the reference-fragrance framing that site.ts replaced with
 *    real formulations. Same rule as VALUE_COMPARISON — no named competitor.
 *
 * 2. How someone wants to be described. The second question is about the
 *    person, not the liquid, because that is the decision actually being made
 *    at $70. It reads on identity while every ANSWER still maps to scent
 *    character, so it routes without flattering.
 *
 * 3. When they will wear it. The tiebreaker, and the most practical of the
 *    three — daylight and after-dark genuinely pull toward different halves of
 *    the catalogue.
 *
 * None of the three questions is about gender, and none can be. The houses are
 * a browsing aid; see Collection.audience in site.ts. */
export const QUIZ: QuizQuestion[] = [
  {
    id: "family",
    prompt: "Which of these smells best to you?",
    options: [
      {
        id: "citrus",
        label: "Cut grapefruit and cold mint",
        hint: "Sharp, clean, wide awake",
        weights: { apollo: 3, poseidon: 1 },
      },
      {
        id: "vanilla",
        label: "Vanilla, amber, warm skin",
        hint: "Soft and close",
        weights: { artemis: 3, aphrodite: 2 },
      },
      {
        id: "smoke",
        label: "Woodsmoke, dark fruit, damp moss",
        hint: "Deep and layered",
        weights: { hades: 3 },
      },
      {
        id: "floral",
        label: "Orange blossom and clean linen",
        hint: "Bright, with an edge",
        weights: { hera: 3, aphrodite: 1 },
      },
    ],
  },
  {
    id: "impression",
    prompt: "How do you want to be described?",
    options: [
      {
        id: "sharp",
        label: "Put together.",
        hint: "Precise, never trying too hard",
        weights: { apollo: 2, hera: 2 },
      },
      {
        id: "warm",
        label: "Warm. Easy to be around.",
        hint: "Comfortable in a room",
        weights: { artemis: 2, poseidon: 1 },
      },
      {
        id: "unreadable",
        label: "Hard to read.",
        hint: "More going on than you let on",
        weights: { hades: 2, aphrodite: 1 },
      },
      {
        id: "magnetic",
        label: "Magnetic.",
        hint: "The one people remember meeting",
        weights: { aphrodite: 3, hades: 1 },
      },
    ],
  },
  {
    id: "occasion",
    prompt: "When are you actually wearing it?",
    options: [
      {
        id: "day",
        label: "Work, daylight, every day",
        hint: "Desks, meetings, errands",
        weights: { apollo: 2, poseidon: 2, hera: 1 },
      },
      {
        id: "night",
        label: "Dinner, drinks, after dark",
        hint: "Close quarters, evening light",
        weights: { aphrodite: 2, hades: 2, artemis: 1 },
      },
      {
        id: "both",
        label: "Both — one stick for everything",
        hint: "It goes where you go",
        weights: { poseidon: 2, hera: 1, artemis: 1 },
      },
    ],
  },
];

/* Answers keyed by question id. A question the reader hasn't reached yet is
 * simply absent, which is what lets the result be computed from a partial run
 * if it ever needs to be. */
export type QuizAnswers = Record<string, string>;

export function isComplete(answers: QuizAnswers): boolean {
  return QUIZ.every((question) => answers[question.id]);
}

/* Sum the weights, highest total wins.
 *
 * Ties break on SCENTS declaration order rather than arbitrarily: iterating
 * the catalogue and keeping a strict `>` means the first-declared scent holds
 * the lead, so the same answers always produce the same recommendation. A tie
 * broken by object key order that happened to change would silently reshuffle
 * everyone's result. */
export function recommendScent(answers: QuizAnswers): ScentId {
  const totals = new Map<ScentId, number>();

  for (const question of QUIZ) {
    const chosen = question.options.find((o) => o.id === answers[question.id]);
    if (!chosen) continue;
    for (const [scent, points] of Object.entries(chosen.weights)) {
      const id = scent as ScentId;
      totals.set(id, (totals.get(id) ?? 0) + (points ?? 0));
    }
  }

  const ids = Object.keys(SCENTS) as ScentId[];
  return ids.reduce((best, id) =>
    (totals.get(id) ?? 0) > (totals.get(best) ?? 0) ? id : best,
  );
}

/* REACHABILITY — every scent must be winnable, or a question is decoration.
 * Checked here rather than trusted, because the failure is silent: a scent
 * that can never be recommended looks exactly like a scent nobody picked.
 *
 * Dev-only. A weights table that has drifted should shout at whoever is
 * editing it, not take the site down for a customer. */
if (process.env.NODE_ENV !== "production") {
  const winners = new Set<ScentId>();
  const walk = (index: number, answers: QuizAnswers) => {
    if (index === QUIZ.length) {
      winners.add(recommendScent(answers));
      return;
    }
    for (const option of QUIZ[index].options) {
      walk(index + 1, { ...answers, [QUIZ[index].id]: option.id });
    }
  };
  walk(0, {});

  const unreachable = (Object.keys(SCENTS) as ScentId[]).filter(
    (id) => !winners.has(id),
  );
  if (unreachable.length > 0) {
    console.warn(
      `[scentQuiz] unreachable scent(s), no answer combination recommends: ${unreachable.join(", ")}`,
    );
  }
}
