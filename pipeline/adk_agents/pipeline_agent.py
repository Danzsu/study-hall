from __future__ import annotations

from google.adk.agents import SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from pipeline.adk_agents.image_eval_agent import image_eval_agent
from pipeline.adk_agents.section_agent import section_loop


study_hall_pipeline = SequentialAgent(
    name="study_hall_pipeline",
    sub_agents=[
        image_eval_agent,   # Step 2: image evaluation
        section_loop,       # Step 3: section generation (one at a time; orchestrator handles parallelism)
    ],
    description="Full Study Hall content generation pipeline",
)


def get_pipeline_runner() -> Runner:
    """Return a Runner bound to a fresh InMemorySessionService for the pipeline agent."""
    return Runner(session_service=InMemorySessionService())
