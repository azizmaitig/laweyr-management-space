/**
 * **Contract** for query-string parameter **names** under `/espace-avocat/*`.
 *
 * - Import `WORKSPACE_QUERY` everywhere you build or read these URLs (router links,
 *   `ActivatedRoute`, `Router#navigate`) so keys stay stable when backends or mocks change.
 * - **Semantics per route** (which component reads/writes each key, and whether the URL keeps
 *   the param or it is stripped after handling) are documented in **`ARCHITECTURE.md`**
 *   → section *Lawyer workspace: deep links (`WORKSPACE_QUERY`)*.
 *
 * Do not rename keys without updating that doc and any bookmarked links.
 */
export const WORKSPACE_QUERY = {
  /** Filter or deep-link by client primary key (`?clientId=`). */
  CLIENT_ID: 'clientId',
  /**
   * Client display name for filters (`?client=`), exact match on `Case.client` / honoraires;
   * URL-encode when non-ASCII.
   */
  CLIENT_NAME: 'client',
  /** Active dossier id (`?case=`). Drives global case selection where wired to `CasesStateService`. */
  CASE_ID: 'case',
  /** Document id with `case` for share / preview (`?doc=`). */
  DOC_ID: 'doc',
} as const;

/** Union of workspace query key strings (runtime values of `WORKSPACE_QUERY`). */
export type WorkspaceQueryKey = (typeof WORKSPACE_QUERY)[keyof typeof WORKSPACE_QUERY];
