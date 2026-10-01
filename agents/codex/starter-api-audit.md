# Codex Starter: API Audit + Agent Introspection

Read and follow:

- `/agents/codex/prompt.md`

That file is the full source-of-truth brief for this run.

## Immediate task

Audit the repository for every API surface, type/interface, event, persistence contract, runtime convention, journey/travel rule, rendering/coordinate convention, and debug/introspection capability.

Then update:

- `/docs/api/README.md`

so it becomes the canonical, exhaustive, source-derived API reference.

## Key architectural goal

This project needs a stable, agent-friendly API foundation that can grow upward indefinitely.

Future agents should be able to understand the live runtime structurally — active plane, object placement, camera, travel mode, journey state, audio, randomization, renderer health, etc. — without requiring screenshots.

The API should support very high optional granularity and sophisticated orchestration while preserving stable API/ABI-style contracts, versioning, and extension points.

## Important

Do not trust existing docs over source.

Extract the real implementation first, reconcile mismatches, document current vs proposed behavior clearly, and run the relevant checks/build before finishing.

Report:

- files changed
- API surfaces found
- mismatches discovered
- documentation added
- whether any Deep Debug foundation was implemented
- test/build results
- recommended next step
