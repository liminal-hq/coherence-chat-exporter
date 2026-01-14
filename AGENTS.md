# AGENTS.md

## Specification Maintenance
* **CRITICAL**: Any time you add a new feature, modify a major flow, or change the architecture, you **MUST** update `SPEC.md` to reflect these changes.
* The `README.md` file should be updated with new feature information when applicable.
* The `SPEC.md` file is the source of truth for the project's design. Do not let it drift from the actual implementation.

## Documentation Maintenance
* **Man Page**: The `man/coherence.1` file must be kept up-to-date.
    * If you add new commands, flags, or significantly change the interactive behaviour, you **MUST** update the man page.
    * Ensure `roff` syntax is valid and Canadian English spelling is used.

## Canadian English Spelling

Documentation, code comments and variables use Canadian English:

- colour (not color)
- centre (not center)
- licence (not license - noun)
- organise (not organize)
- behaviour (not behavior)
- favour (not favor)

Code identifiers follow web standards (e.g., `color` in CSS, `center` in alignment).
