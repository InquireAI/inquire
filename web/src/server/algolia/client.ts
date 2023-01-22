import algoliasearch from "algoliasearch";
import { env } from "../../env/server.mjs";

export const algolia = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_KEY);

export type AlgoliaPersona = {
  objectID: string;
  id: string;
  name: string;
  prompt: string;
  description: string;
};
