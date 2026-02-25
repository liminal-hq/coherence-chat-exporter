# AGENTS.md

## Specification Maintenance
* **CRITICAL**: Any time you add a new feature, modify a major flow, or change the architecture, you **MUST** update `SPEC.md` to reflect these changes.
* The `README.md` file should be updated with new feature information when applicable.
* The `SPEC.md` file is the source of truth for the project's design. Do not let it drift from the actual implementation.

## Canadian English Spelling

Documentation, code comments and variables **MUST** use Canadian English spelling:

- colour (not color)
- centre (not center)
- licence (not license - noun)
- organise (not organize)
- behaviour (not behavior)
- favour (not favor)

Code identifiers follow web standards (e.g., `color` in CSS, `center` in alignment).

## Git Commit Guidelines

* **Accuracy**: Commit messages must accurately reflect the changes made in the commit.
* **Granularity**: Avoid monolithic commits that hide multiple unrelated changes under a generic message.
* **Subject Format**: Use conventional commit style (`type: summary`) with a concise, lowercase, imperative summary.
* **Body**: Include a short bullet-list body for every commit that explains:
  * what changed
  * why it changed
* **Backticks**: In commit bodies, wrap technical tokens in backticks (for example file names, commands, package names, types, and dependency refs).
