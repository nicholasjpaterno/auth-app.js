const PATHS = [
  "/app",
  "/app/installations",
  "/app/installations/:installation_id",
  "/app/installations/:installation_id",
  "/app/installations/:installation_id/access_tokens",
  "/orgs/:org/installation",
  "/orgs/:org/installation",
  "/repos/:owner/:repo/installation",
  "/repos/:owner/:repo/installation",
  "/users/:username/installation",
  "/users/:username/installation"
];

// CREDIT: Simon Grondin (https://github.com/SGrondin)
// https://github.com/octokit/plugin-throttling.js/blob/45c5d7f13b8af448a9dbca468d9c9150a73b3948/lib/route-matcher.js
function routeMatcher(paths: string[]) {
  // EXAMPLE. For the following paths:
  /* [
      "/orgs/:org/invitations",
      "/repos/:owner/:repo/collaborators/:username"
  ] */

  const regexes = paths.map(p =>
    p
      .split("/")
      .map(c => (c.startsWith(":") ? "(?:.+?)" : c))
      .join("/")
  );
  // 'regexes' would contain:
  /* [
      '/orgs/(?:.+?)/invitations',
      '/repos/(?:.+?)/(?:.+?)/collaborators/(?:.+?)'
  ] */

  const regex = `^(?:${regexes.map(r => `(?:${r})`).join("|")})[^/]*$`;
  // 'regex' would contain:
  /*
    ^(?:(?:\/orgs\/(?:.+?)\/invitations)|(?:\/repos\/(?:.+?)\/(?:.+?)\/collaborators\/(?:.+?)))[^\/]*$

    It may look scary, but paste it into https://www.debuggex.com/
    and it will make a lot more sense!
  */

  return new RegExp(regex, "i");
}

const REGEX = routeMatcher(PATHS);

type Options = {
  url?: string;
  [key: string]: any;
};

export function isAppRoute(options: Options): Boolean {
  return !!options.url && REGEX.test(options.url);
}
