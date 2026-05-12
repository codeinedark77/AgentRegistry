import time
import json
import httpx
import re
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

# Adjust these imports if your folder structure is slightly different
from app.models.task_queue import TaskQueue
from app.models.execution_log import ExecutionLog
from app.models.agent_config import AgentConfig
from app.services.agent_tools import AVAILABLE_TOOLS

logger = logging.getLogger(__name__)
OLLAMA_URL = "http://localhost:11434/api/generate"

# UPGRADED PROMPT: Context-Aware Tool Management
TOOL_SYSTEM_PROMPT = """
You are an advanced, context-aware AI orchestrator. You have access to external tools, but you must ONLY use them if absolutely necessary.

Available Tools:
1. fetch_live_crop_prices(crop_name: str, location: str)
2. get_weather_forecast(location: str)
3. analyze_soil_ph(ph_level: str)
4. calculate_fertilizer_requirement(crop_name: str, acres: str)
5. diagnose_crop_disease(symptom: str)
6. analyze_satellite_imagery(region: str, anomaly_type: str) 
7. check_system_ram(ignored: str)
8. execute_system_ping(target_url: str)
9. check_docker_containers(ignored: str)

CRITICAL PROTOCOL:
1. ANALYZE INTENT: First, read the user's prompt. Is it a general greeting, a generic question, or a request for your tools?
2. NO TOOLS NEEDED: If the user says "hi", asks for general advice, or doesn't explicitly need live/system data, DO NOT use a tool. Answer them directly in plain text.
3. TOOLS NEEDED: ONLY if the prompt requires live data, OS execution, or math, output exactly one JSON block: {"tool": "tool_name", "kwargs": {"param": "value"}}
4. FEEDBACK: If a tool returns an observation, process it and give the final answer in plain text without mentioning the JSON process.
"""

async def run_agent_task(db: AsyncSession, agent_id: int, prompt_text: str):
    # 1. Fetch the Agent Configuration
    agent = await db.get(AgentConfig, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # 2. Log task as PENDING in the database
    new_task = TaskQueue(agent_id=agent.id, prompt_text=prompt_text, status='PENDING')
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    # 3. Transition to RUNNING
    new_task.status = 'RUNNING'
    await db.commit()
    
    start_time = time.perf_counter_ns()
    full_system_prompt = f"{agent.system_prompt}\n\n{TOOL_SYSTEM_PROMPT}"
    
    # --- UPGRADE: RECURSIVE REASONING LOOP ---
    current_prompt = prompt_text
    max_iterations = 5  # Prevent infinite loops
    iteration = 0
    final_response = "Agent failed to converge on a solution within the maximum allowed steps."

    try:
        async with httpx.AsyncClient() as client:
            while iteration < max_iterations:
                iteration += 1
                print(f"[ORCHESTRATOR STEP {iteration}] Thinking...")

                payload = {
                    "model": agent.model_name,
                    "system": full_system_prompt,
                    "prompt": current_prompt,
                    "stream": False,
                    "temperature": 0.1,
                    "keep_alive": -1
                }

                # LLM Pass
                resp = await client.post(OLLAMA_URL, json=payload, timeout=300.0)
                resp.raise_for_status()
                llm_output = resp.json().get("response", "").strip()

                # Search for JSON tool call
                match = re.search(r'\{[\s\S]*?"tool"[\s\S]*?\}', llm_output)
                print(f"  [LLM RAW OUTPUT]: {llm_output}") # This will show up in your docker logs

                if match:
                    try:
                        tool_req = json.loads(match.group(0))
                        t_name = tool_req.get("tool")
                        t_kwargs = tool_req.get("kwargs", {})

                        if t_name in AVAILABLE_TOOLS:
                            print(f"  [ACTION] Executing {t_name} with params: {t_kwargs}")
                            try:
                                # Execute the Python Tool dynamically
                                if isinstance(t_kwargs, dict):
                                    tool_result = AVAILABLE_TOOLS[t_name](**t_kwargs)
                                else:
                                    tool_result = AVAILABLE_TOOLS[t_name](str(t_kwargs))
                            except Exception as tool_exec_err:
                                tool_result = f"Error executing tool: {str(tool_exec_err)}"

                            # FEEDBACK LOOP: Update prompt with tool output for the next "thought"
                            current_prompt += (
    f"\n\n[SYSTEM] Tool '{t_name}' output: {tool_result}\n"
    "You have the information. Do NOT call any more tools. "
    "Provide the final answer to the user in plain text now."
)
                            continue # Go to next iteration to let LLM process the result
                        else:
                            current_prompt += f"\n\nError: Tool '{t_name}' does not exist."
                            continue
                    except json.JSONDecodeError:
                        # LLM yapped invalid JSON, feed it back to it to fix
                        current_prompt += "\n\nError: Your last tool call was invalid JSON. Please correct your format."
                        continue
                else:
                    # Clean up the output to remove any leftover JSON thoughts
                    final_response = re.sub(r'\{[\s\S]*?\}', '', llm_output).strip()
                    if final_response:
                        break
                    else:
                        current_prompt += "\n\nYou provided an empty response. Please give the final answer."
                        continue

    except Exception as e:
        new_task.status = 'FAILED'
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Loop Error: {str(e)}")

    # --- WRAP UP ---
    elapsed_ms = (time.perf_counter_ns() - start_time) // 1_000_000
    new_task.status = 'COMPLETED'
    
    new_log = ExecutionLog(
        task_id=new_task.id,
        response_text=final_response,
        execution_time_ms=elapsed_ms
    )
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)

    return new_log