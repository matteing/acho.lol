# Security

Security fixes target the current `main` branch. This is a static site: there is no application database, sign-in, or server API.

Report exploitable issues privately through the repository's **Security → Report a vulnerability** option when it is available. Otherwise, use the maintainer's contact details on their GitHub profile to arrange a private report. Include reproduction steps, affected versions or pages, and the expected impact; do not post credentials or an undisclosed exploit in a public issue.

Markdown is parsed and sanitized before publication. Embed providers and URL formats are allowlisted. Changes to sanitization, link resolution, preview payloads, or generated HTML should include regression tests for unsafe input. External embeds load directly from their providers; those services control their own availability and behavior.

Keep dependencies and the lockfile current, review automated update pull requests, and run the full validation suite before deploying. Development environment files and Vercel credentials must remain untracked.
