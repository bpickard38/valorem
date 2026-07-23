/*
 * Collection artwork resolution. Server-only — reads the filesystem, so import
 * this from server components only.
 *
 * The two collection cards on /collections each want one big photograph. Rather
 * than pin a filename in code and break the page the moment the photo arrives
 * as a .webp instead of a .jpg, this looks for public/collections/<id>.<ext>
 * and returns whatever it finds. Dropping `gods.jpg` into that folder is the
 * entire deploy step; no code change, no rebuild of the catalogue.
 *
 * An explicit `image` path on the Collection wins if one is ever set — that is
 * the escape hatch for artwork living somewhere other than /collections.
 *
 * Returns null when there is no file, and the card renders its engraved
 * placeholder instead of a broken frame.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Collection, CollectionId } from "@/lib/site";

/* Ordered by preference: the modern formats first, so if someone uploads both
 * a .jpg and a .webp of the same shot the smaller one wins. */
const EXTENSIONS = ["avif", "webp", "png", "jpg", "jpeg"];

const DIR = join(process.cwd(), "public", "collections");

export function collectionImage(collection: Collection): string | null {
  if (collection.image) return collection.image;
  return findInPublic(collection.id);
}

function findInPublic(id: CollectionId): string | null {
  if (!existsSync(DIR)) return null;
  /* readdir rather than an existsSync per extension: one syscall, and it lets
   * the match be case-insensitive, which matters because phone cameras and
   * design tools hand back .JPG about as often as .jpg. */
  const files = readdirSync(DIR);
  for (const ext of EXTENSIONS) {
    const match = files.find(
      (f) => f.toLowerCase() === `${id}.${ext}`,
    );
    if (match) return `/collections/${match}`;
  }
  return null;
}
