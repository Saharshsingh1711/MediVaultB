import { algoliasearch } from "algoliasearch";

const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_WRITE_API_KEY!,
);

export const DOC_INDEX_NAME = "use_doc_index";
export const PATIENT_INDEX_NAME = "use_patient_index";

export const algolia = {
  indexes: { DOC_INDEX_NAME, PATIENT_INDEX_NAME },
  algoliaClient,
};
