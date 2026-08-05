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

interface QuizQuestionBase {
  id: string;
  prompt: string;
}

/* Most questions show the same options to everyone. */
export interface FixedQuestion extends QuizQuestionBase {
  options: QuizOption[];
}

/* A question whose options depend on an earlier answer. `branchOn` names that
 * question's id and `branches` maps each of its option ids to a list.
 *
 * This exists for one reason: the two houses do not contain the same scents,
 * so they cannot sensibly share a scent-family question. Asking a shared list
 * left dead ends — "floral" meant nothing to the Gods and "spicy" nothing to
 * the Goddesses, so on those paths question 2 contributed zero and the weather
 * silently decided everything. Branching gives each house exactly the three
 * families it actually has. */
export interface BranchedQuestion extends QuizQuestionBase {
  branchOn: string;
  branches: Record<string, QuizOption[]>;
}

export type QuizQuestion = FixedQuestion | BranchedQuestion;

/* The options to render/score for a question, given what has been answered so
 * far. Returns empty for a branched question whose parent is unanswered, which
 * only happens if the questions are reordered so a branch precedes its parent
 * — the dev check at the bottom of this file catches that. */
export function optionsFor(
  question: QuizQuestion,
  answers: QuizAnswers,
): QuizOption[] {
  if ("options" in question) return question.options;
  const key = answers[question.branchOn];
  return key ? (question.branches[key] ?? []) : [];
}

/* Three questions, not five. Each additional step sheds people, and three is
 * already enough to separate all six — proven by the reachability walk at the
 * bottom of this file.
 *
 * HOW THE QUESTIONS ARE WRITTEN, AND WHY
 *
 * 1. Masculine or feminine. Added 2026-08-05, when the two houses became an
 *    audience split (see AGENTS.md and Collection.audience in site.ts). This
 *    question exists to PICK THE HOUSE, and its weights are deliberately
 *    blunt: a flat +8 to all three scents in one house, which no combination
 *    of questions 2 and 3 can overcome (their ceiling together is 6). So the
 *    answer here is a hard gate, not a nudge — a masculine answer can only
 *    ever return a cologne, and that is the point of asking it.
 *
 *    Note the wording asks what the READER WANTS, not who they are. "Are you
 *    after something masculine or feminine?" describes the scent and routes
 *    just as reliably as demanding a shopper classify themselves, and it
 *    leaves the door open to anyone who wants the other house's three.
 *
 *    Deliberately NOT anchored on designer fragrances. "Like Bleu de Chanel"
 *    would be the most recognisable option of all, and it is exactly what this
 *    file must not do: it makes a claim about someone else's product, invites
 *    a comparison the formula has never been tested against, and drags the
 *    brand back to the reference-fragrance framing that site.ts replaced with
 *    real formulations. Same rule as COMPARISON in site.ts — no named
 *    competitor.
 *
 * 2. Scent family, BRANCHED ON QUESTION 1, and the question that actually
 *    decides the answer. The reader sees the three families their house
 *    contains and nothing else: clean / spicy / smoky for the Gods, sweet /
 *    fresh / rich for the Goddesses. Three options, three scents, one leader
 *    each — so answering this names the recommendation outright.
 *
 *    It was a single shared list until 2026-08-05, which had two faults. The
 *    Gods have nothing floral and the Goddesses nothing smoky, so those
 *    options were dead ends where the weather silently decided everything;
 *    and the leader gaps were small enough that question 3 outranked this one
 *    on half the paths. Branching fixes the first, the 7-vs-2 weighting the
 *    second.
 *
 * 3. Weather. A TIEBREAK, and scoped to be exactly that. It is capped at 2,
 *    and question 2's leaders sit 5 clear of their runners-up in four of the
 *    six families — so in those four the weather cannot touch the result.
 *
 *    In the remaining two it decides, on purpose. One family per house is
 *    weighted 7-to-6 rather than 7-to-2 ("spicy" for the Gods, "rich" for the
 *    Goddesses), because in those two the near-tie is real and the weather is
 *    the honest way to break it. That is the whole job: 8 of 24 paths, in the
 *    two places where a tie exists, and nowhere else.
 *
 *    Air temperature is the right axis for it because it is the one thing that
 *    changes how these materials behave — citrus lifts and burns off in heat,
 *    resins and smoke bloom in the cold.
 *
 *    If a future edit widens those two gaps back to 5, this question stops
 *    changing any answer at all and becomes decoration. Check the influence
 *    numbers before touching them.
 *
 * WHAT WAS TRIED AND REJECTED. A binary "sweet or fresh?" in slot 2 was
 * measured across all paths and dropped Hades to 2 wins in 32: it is smoky
 * birch and oakmoss, so neither pole describes it, and the only fix was to
 * file it under "sweet", which mislabels the product to the customer. Any
 * replacement option here has to leave every scent a lane. */
export const QUIZ: QuizQuestion[] = [
  {
    id: "house",
    prompt: "Are you after something masculine or feminine?",
    options: [
      {
        id: "masculine",
        label: "Masculine",
        hint: "The Gods — solid cologne",
        weights: { hades: 20, poseidon: 20, apollo: 20 },
      },
      {
        id: "feminine",
        label: "Feminine",
        hint: "The Goddesses — solid perfume",
        weights: { artemis: 20, hera: 20, aphrodite: 20 },
      },
    ],
  },
  {
    id: "family",
    prompt: "Which of these smells best to you?",
    branchOn: "house",
    /* THE DECIDING QUESTION. Each branch lists three families for three
     * scents, one leader each at 7 against a 2 for its nearest neighbour. That
     * gap is deliberately larger than anything question 3 can add (max 2), so
     * a family answer cannot be overridden by the weather — which is the whole
     * point: this question is what picks the scent, and the previous shared
     * list let weather outrank it on half the paths.
     *
     * The runner-up weights are not decoration. They are what the answer would
     * mean if the leader did not exist, and they keep the table honest about
     * how close two scents actually are — Poseidon really is the second
     * smokiest of the Gods.
     *
     * Both branches must stay exhaustive: three options, three scents, every
     * scent the leader of exactly one. Add a scent to a house and it needs its
     * own family here or it can never be recommended. */
    branches: {
      masculine: [
        {
          id: "clean",
          label: "Fresh and clean",
          hint: "Grapefruit, lemon, cold mint",
          weights: { apollo: 7, poseidon: 2 },
        },
        {
          id: "spicy",
          label: "Spicy and warm",
          hint: "Sichuan pepper, star anise, amber",
          /* THE GODS' DELIBERATE NEAR-TIE — 7 to 6, not 7 to 2. This is the
           * one family in this house where question 3 is allowed to decide,
           * and it is this one because the near-tie is true: both scents open
           * on pepper, Poseidon on Sichuan and Hades on pink. Cold air adds 2
           * to Hades and tips it, which is the real behaviour of the pair — a
           * spicy scent in the cold leans on its smoky base.
           *
           * Keep the gap at exactly 1. At 2 the weather can only draw and the
           * tiebreak decides on declaration order; at 0 the families stop
           * meaning anything and Hades takes the lane outright. */
          weights: { poseidon: 7, hades: 6 },
        },
        {
          /* Hades needs a lane of its own or it is unreachable, and "smoky" is
           * the only honest word for birch, oakmoss and cedar. This is the
           * option that was dropped from the shared list as "dark"; branching
           * brings it back where it belongs — in front of the readers who
           * chose the house that contains it, and nowhere near the Goddesses,
           * none of whom smell remotely like this. */
          id: "smoky",
          label: "Smoky and deep",
          hint: "Birch, oakmoss, black currant",
          weights: { hades: 7, poseidon: 1 },
        },
      ],
      feminine: [
        {
          id: "sweet",
          label: "Sweet and warm",
          hint: "Vanilla and soft amber",
          /* Artemis leads outright rather than tying Aphrodite. It IS this
           * answer — warm vanilla in soft amber, the only scent in the
           * catalogue with no second idea in it — while Aphrodite reaches
           * sweetness through vanilla orchid on the way to jasmine. */
          weights: { artemis: 7, aphrodite: 2 },
        },
        {
          id: "fresh",
          label: "Fresh and floral",
          hint: "Lavender, mandarin, orange blossom",
          weights: { hera: 7, aphrodite: 1 },
        },
        {
          id: "rich",
          label: "Rich and floral",
          hint: "Jasmine, vanilla orchid, amberwood",
          /* THE GODDESSES' DELIBERATE NEAR-TIE, the mirror of "spicy" above.
           * Both scents are built on jasmine, so the split is not about the
           * flower but about how often you would wear it: Aphrodite is the
           * occasion one, Hera the lighter everyday floral on lavender and
           * mandarin. "All year, without thinking" is therefore the answer
           * that tips it to Hera, and it is the only weather that does.
           *
           * Not "sweet" and not "fresh": sweet is Artemis outright by
           * instruction, and softening fresh would change nothing, because the
           * weather table already favours Hera on both mild and all-year — the
           * two answers that would have to move it. */
          weights: { aphrodite: 7, hera: 6 },
        },
      ],
    },
  },
  {
    id: "weather",
    prompt: "When do you reach for fragrance most?",
    options: [
      /* Capped at 2, against question 2's leader gap of 5. That makes this a
       * TIEBREAK, not a vote: it can separate two scents question 2 left
       * level, and it cannot overturn a family answer. Raise anything here to
       * 5 and the weather starts deciding the scent again. */
      {
        id: "cold",
        label: "Cold air, coat weather",
        hint: "Close and warming",
        weights: { artemis: 2, hades: 2 },
      },
      {
        id: "hot",
        label: "Hot air, bright sun",
        hint: "Sharp and cooling",
        weights: { apollo: 2, poseidon: 2 },
      },
      {
        id: "mild",
        label: "Spring and autumn",
        hint: "Floral, in between",
        weights: { hera: 2, aphrodite: 1 },
      },
      {
        id: "all",
        label: "All year, without thinking",
        hint: "One stick, no season",
        weights: { poseidon: 2, hera: 2 },
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
    /* optionsFor, not question.options — a branched question's answer is only
     * meaningful against the branch its parent answer selected. Looking it up
     * in the wrong branch would score a Gods family answer against the
     * Goddesses, which is exactly what going Back and switching houses would
     * otherwise produce. Missing means "not answered on this path" and
     * contributes nothing. */
    const chosen = optionsFor(question, answers).find(
      (o) => o.id === answers[question.id],
    );
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
  /* Walks branches correctly because it passes the answers accumulated so far
   * to optionsFor — the same call recommendScent makes — so a branched
   * question is only ever explored through the parent answers that reach it. */
  const walk = (index: number, answers: QuizAnswers) => {
    if (index === QUIZ.length) {
      winners.add(recommendScent(answers));
      return;
    }
    const options = optionsFor(QUIZ[index], answers);
    if (options.length === 0) {
      console.warn(
        `[scentQuiz] question "${QUIZ[index].id}" has no options on this path — a branched question is probably ordered before the question it branches on`,
      );
      return;
    }
    for (const option of options) {
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
