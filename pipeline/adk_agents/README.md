# adk_agents — EXPERIMENTAL (not wired into the live pipeline)

Google ADK re-implementation of section generation. **Nothing in the live
pipeline imports this package.** The orchestrator uses the proven asyncio
`pipeline/section_pipeline.py`.

`generate_all_sections_adk(doc, config, image_decisions=None, job_id=None, concurrency=5)`
in `section_agent.py` is a **drop-in replacement** for
`section_pipeline.generate_all_sections`. To trial it, install the extra dep
and swap the import in `orchestrator.py`:

    pip install -r pipeline/requirements-experimental.txt

Requires `google-adk`, which is intentionally excluded from the main
`requirements.txt` so the live install stays lean. Do not import this package
from any live-path module without adding the dependency back.
