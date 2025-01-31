import { request } from "@octokit/request";

import {
  Authentication,
  AuthOptions,
  Permissions,
  StrategyOptionsWithDefaults,
  WithInstallationId
} from "./types";
import { isAppRoute } from "./is-app-route";
import { toTokenAuthentication } from "./to-token-authentication";
import { toAppAuthentication } from "./to-app-authentication";
import { get, set } from "./cache";

export async function auth(
  state: StrategyOptionsWithDefaults,
  options: AuthOptions = {}
) {
  // installationId is never 0, so a simple check here is fine
  const installationId = (options.installationId ||
    state.installationId) as number;

  if (installationId && !options.refresh) {
    const result = get(state.cache, options);
    if (result) {
      const {
        token,
        expiresAt,
        permissions,
        repositoryIds,
        singleFileName
      } = result;

      return toTokenAuthentication(
        installationId,
        token,
        expiresAt,
        permissions,
        repositoryIds,
        singleFileName
      );
    }
  }

  const appAuthentication = toAppAuthentication(state.id, state.privateKey);

  if (isAppRoute(options) || !installationId) {
    return appAuthentication;
  }

  const {
    data: { token, expires_at, repositories }
  } = await state.request(
    "POST /app/installations/:installation_id/access_tokens",
    {
      installation_id: installationId,
      repository_ids: options.repositoryIds,
      permissions: options.permissions,
      previews: ["machine-man"],
      headers: appAuthentication.headers
    }
  );

  const repositoryIds = repositories
    ? repositories.map((r: { id: number }) => r.id)
    : void 0;

  const {
    data: { permissions, single_file_name: singleFileName }
  } = await state.request("GET /app/installations/:installation_id", {
    installation_id: options.installationId || state.installationId,
    previews: ["machine-man"],
    headers: appAuthentication.headers
  });

  set(state.cache, options, {
    token,
    expires_at,
    permissions,
    repositoryIds,
    singleFileName
  });

  return toTokenAuthentication(
    installationId,
    token,
    expires_at,
    permissions,
    repositoryIds,
    singleFileName
  );
}
