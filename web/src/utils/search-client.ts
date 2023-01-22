import algoliasearch from "algoliasearch";
import type { BaseHit } from "instantsearch.js";
import { env } from "../env/client.mjs";

export const searchClient = algoliasearch(
  env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
);

export interface AlgoliaPersona extends BaseHit {
  objectID: string;
  id: string;
  name: string;
  prompt: string;
  description: string;
}
