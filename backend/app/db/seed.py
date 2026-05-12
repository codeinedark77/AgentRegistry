#!/usr/bin/env python3
"""
AgentRegistry — Production Demo Seeder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Populates the database with enterprise-quality demo data so the analytics
dashboard, agent grid, and task runner all look like a live production system
on first load.

Usage (Docker — recommended):
    docker compose exec backend python -m app.db.seed

Usage (local venv):
    cd backend && python -m app.db.seed

Force re-seed (wipes existing data first):
    docker compose exec backend python -m app.db.seed --force
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.core.security import hash_password
from app.db.session import AsyncSessionFactory
from app.models.agent_config import AgentConfig
from app.models.execution_log import ExecutionLog
from app.models.task_queue import TaskQueue, TaskStatus
from app.models.user import User, UserRole
from app.models.workspace import Workspace

# ── Reproducible randomness ───────────────────────────────────────────────────
random.seed(2024)

# ── ANSI colours ──────────────────────────────────────────────────────────────
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
DIM    = "\033[2m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


def banner(text: str, color: str = CYAN) -> None:
    width = 66
    print(f"\n{color}{BOLD}{'━' * width}{RESET}")
    print(f"{color}{BOLD}  {text}{RESET}")
    print(f"{color}{BOLD}{'━' * width}{RESET}\n")


def section(text: str) -> None:
    print(f"{CYAN}{BOLD}▸ {text}{RESET}")


def ok(text: str) -> None:
    print(f"  {GREEN}✓{RESET}  {text}")


def info(text: str) -> None:
    print(f"  {DIM}  {text}{RESET}")


def warn(text: str) -> None:
    print(f"  {YELLOW}⚠{RESET}  {text}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SEED DATA DEFINITIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ── Users ─────────────────────────────────────────────────────────────────────

USERS: list[dict] = [
    {
        "username": "admin_upjaoo",
        "password": "Admin@AgentRegistry2024",
        "role":     UserRole.ADMIN,
    },
    {
        "username": "dev_arjun",
        "password": "DevPass@2024!",
        "role":     UserRole.STANDARD,
    },
]

# ── Workspaces ────────────────────────────────────────────────────────────────
# owner_index → index into USERS list

WORKSPACES: list[dict] = [
    {
        "owner_index": 0,
        "name":        "Upjaoo Ops",
        "description": (
            "Production agents for the Upjaoo AgTech platform. Handles crop advisory, "
            "market price prediction, soil analysis, and farmer support at scale."
        ),
    },
    {
        "owner_index": 1,
        "name":        "Local Dev",
        "description": (
            "Development and testing workspace. Houses code review agents, API documentation "
            "writers, and commit message generators used in the engineering workflow."
        ),
    },
    {
        "owner_index": 0,
        "name":        "Research Lab",
        "description": (
            "Experimental AI research workspace. Benchmarking new Ollama models, exploring "
            "multi-step reasoning, and evaluating response quality across model families."
        ),
    },
]

# ── Agent Configurations ──────────────────────────────────────────────────────
# workspace_index → index into WORKSPACES list
# avg_ms / std_ms → Gaussian params for execution_time_ms generation

AGENTS: list[dict] = [
    # ──────────────────────────────────────────────────
    # WORKSPACE 0 — Upjaoo Ops
    # ──────────────────────────────────────────────────
    {
        "workspace_index": 0,
        "model_name":      "llama3",
        "temperature":     0.70,
        "avg_ms":          3200,
        "std_ms":          750,
        "system_prompt": (
            "You are Saathi, an expert agricultural advisory agent for Indian farmers. "
            "You possess deep knowledge of Kharif and Rabi crop cycles, soil health, "
            "irrigation techniques, integrated pest management, and government schemes "
            "such as PM-KISAN and eNAM. Always respond in a warm, empathetic tone with "
            "actionable, region-specific guidance. When diagnosing plant issues, describe "
            "visual symptoms, causative agents, and both organic and chemical treatment "
            "options with precise dosage and application timing."
        ),
    },
    {
        "workspace_index": 0,
        "model_name":      "llama3:8b",
        "temperature":     0.35,
        "avg_ms":          2550,
        "std_ms":          600,
        "system_prompt": (
            "You are a Crop Disease Diagnostic Agent specialising in phytopathology. "
            "Analyse symptom descriptions from farmers and identify the most probable "
            "fungal, bacterial, viral, or nutritional disorder affecting the crop. "
            "Structure every response into three mandatory sections: "
            "(1) Probable Diagnosis with pathogen name, "
            "(2) Confidence Level as a percentage with reasoning, "
            "(3) Recommended Treatment Protocol with application schedule."
        ),
    },
    {
        "workspace_index": 0,
        "model_name":      "mistral",
        "temperature":     0.50,
        "avg_ms":          2050,
        "std_ms":          450,
        "system_prompt": (
            "You are a Market Price Intelligence Agent for Indian agricultural commodity markets. "
            "Analyse APMC mandi price data, seasonal demand-supply cycles, MSP announcements, "
            "and export/import policy changes to generate market outlook reports. "
            "Always present price data in a structured table format with percentage "
            "change indicators, a 30-day price forecast, and a risk rating (Low/Medium/High)."
        ),
    },
    {
        "workspace_index": 0,
        "model_name":      "gemma:7b",
        "temperature":     0.55,
        "avg_ms":          1800,
        "std_ms":          400,
        "system_prompt": (
            "You are a Soil Health Analyst Agent. You interpret laboratory soil test reports — "
            "including NPK levels, pH, electrical conductivity, organic carbon percentage, "
            "and micronutrient panels — and generate precise fertilizer recommendation plans. "
            "Your output must always include a Soil Health Score (0–100), a traffic-light "
            "nutrient status summary, and a 90-day soil improvement roadmap with product names, "
            "quantities in kg/acre, and application methods."
        ),
    },
    # ──────────────────────────────────────────────────
    # WORKSPACE 1 — Local Dev
    # ──────────────────────────────────────────────────
    {
        "workspace_index": 1,
        "model_name":      "codellama",
        "temperature":     0.20,
        "avg_ms":          4750,
        "std_ms":          1100,
        "system_prompt": (
            "You are a Senior Code Review Agent specialising in Python and TypeScript. "
            "Review submitted code for: (1) logic correctness and edge cases, "
            "(2) security vulnerabilities including SQL injection, IDOR, and XSS, "
            "(3) performance bottlenecks and algorithmic complexity, "
            "(4) adherence to SOLID principles and clean code standards. "
            "Output your review as a structured JSON object with a findings array, "
            "each item containing: severity (CRITICAL/HIGH/MEDIUM/LOW/INFO), "
            "line reference, description, and suggested fix."
        ),
    },
    {
        "workspace_index": 1,
        "model_name":      "gemma:2b",
        "temperature":     0.75,
        "avg_ms":          680,
        "std_ms":          180,
        "system_prompt": (
            "You are a FastAPI Documentation Writer Agent. You generate production-grade "
            "OpenAPI docstrings, endpoint descriptions, Pydantic schema documentation, "
            "and inline code comments for Python FastAPI applications. "
            "Follow Google docstring conventions. Always include parameter descriptions, "
            "return type descriptions, example request/response bodies, and "
            "raised exception documentation."
        ),
    },
    {
        "workspace_index": 1,
        "model_name":      "phi3:mini",
        "temperature":     0.85,
        "avg_ms":          420,
        "std_ms":          130,
        "system_prompt": (
            "You are a Git Commit Message Agent following the Conventional Commits 1.0.0 "
            "specification. Given a description of code changes or a diff summary, generate "
            "a well-structured commit message. Output exactly: one subject line under 72 chars "
            "with the correct type prefix (feat/fix/docs/chore/refactor/perf/test), "
            "one blank line, then an optional body with bullet points explaining the 'why'."
        ),
    },
    # ──────────────────────────────────────────────────
    # WORKSPACE 2 — Research Lab
    # ──────────────────────────────────────────────────
    {
        "workspace_index": 2,
        "model_name":      "mistral:7b",
        "temperature":     0.60,
        "avg_ms":          2380,
        "std_ms":          550,
        "system_prompt": (
            "You are a Research Paper Summarization Agent processing academic papers "
            "and technical reports for the Upjaoo R&D division. "
            "Your structured output must contain exactly these sections: "
            "Abstract (2 sentences max), Key Contributions (3–5 bullet points), "
            "Methodology Overview (1 paragraph), Limitations & Gaps, "
            "and a Practical Applicability Score (1–10) for deployment in "
            "Indian smallholder farming contexts."
        ),
    },
    {
        "workspace_index": 2,
        "model_name":      "phi3",
        "temperature":     0.45,
        "avg_ms":          1050,
        "std_ms":          280,
        "system_prompt": (
            "You are a Model Quality Benchmarking Agent. Your role is to evaluate LLM "
            "responses for factual accuracy, semantic coherence, completeness, and "
            "hallucination risk. For each response evaluated, produce a structured scorecard: "
            "Accuracy (0–10), Coherence (0–10), Completeness (0–10), "
            "Hallucination Risk (Low/Medium/High), and an Overall Quality Grade (A/B/C/D/F) "
            "with a 2-sentence justification."
        ),
    },
    {
        "workspace_index": 2,
        "model_name":      "llama3",
        "temperature":     0.30,
        "avg_ms":          3450,
        "std_ms":          850,
        "system_prompt": (
            "You are a Statistical Data Interpretation Agent for the Upjaoo research division. "
            "You translate complex statistical outputs — regression analyses, ANOVA tables, "
            "clustering results, and ML model metrics — into clear, actionable business insights "
            "for non-technical stakeholders including policymakers and agricultural officers. "
            "Always quantify uncertainty, state key assumptions explicitly, and provide "
            "confidence intervals for every primary finding."
        ),
    },
]

# ── Prompt pool keyed by agent index ──────────────────────────────────────────

PROMPT_POOL: dict[int, list[str]] = {
    0: [  # llama3 — Saathi Agricultural Advisory
        "What is the ideal sowing window for wheat in Punjab and which seed variety gives maximum yield for sandy loam soil?",
        "My paddy crop in West Bengal is showing yellowing of lower leaves with brown tips. Is this nitrogen deficiency or a disease?",
        "How do I prepare my black cotton soil in Vidarbha for sugarcane cultivation? Current pH is 7.8 and EC is 1.2 dS/m.",
        "What is the PM-KISAN eligibility and how does a marginal farmer in Rajasthan apply? What documents are needed?",
        "My maize crop is 45 days old and the leaves are rolling inward during the day. Is this heat stress or fall armyworm?",
        "Calculate the optimal drip irrigation schedule for cotton during boll formation stage for a 5-acre field in Gujarat.",
        "What is the current MSP for paddy and wheat for Kharif 2024-25 and where do I register for procurement in Haryana?",
        "How can I improve the organic carbon content in my degraded red laterite soil in Jharkhand for vegetable farming?",
        "Explain the correct method of integrated nutrient management for a rice-wheat crop rotation system.",
    ],
    1: [  # llama3:8b — Crop Disease Diagnostics
        "Symptoms: White powdery coating on young mango shoots, curling of tender leaves, progressive yellowing. Tree is 4 years old in Konkan Maharashtra.",
        "Tomato plants show dark water-soaked lesions at stem base near soil line. Leaves yellowing from bottom up, plant wilting by afternoon. Located near Nashik.",
        "Wheat crop shows orange-yellow pustules on leaf surface, forming elongated stripes. Spreading rapidly. Located near Ludhiana, Punjab.",
        "Cotton leaves have circular reddish-brown spots with bright yellow halo. Disease spread rapidly after unseasonal rain in Telangana.",
        "Banana pseudostem shows dark streaks when cut cross-section. Plant yellowing with wilting of oldest leaves first. Cavendish variety in Tamil Nadu.",
        "Chilli plants show mosaic discolouration, leaf curl, and stunted growth since 3 weeks. Aphids were observed 2 weeks ago. Andhra Pradesh.",
        "Groundnut pods have black fungal growth inside when harvested early. Yellowing of plants before maturity. Rajasthan district.",
    ],
    2: [  # mistral — Market Price Intelligence
        "Analyse the price trend for onions at Lasalgaon APMC over the last 6 months and provide a 30-day forward outlook with key risk factors.",
        "What macroeconomic and supply-chain factors are driving the current 340% spike in tomato retail prices across India?",
        "Compare the current procurement prices for soybean across mandis in Madhya Pradesh vs Maharashtra and identify arbitrage opportunities.",
        "Provide a market outlook for Indian basmati rice export prices for Q3 2024 considering Pakistan competition and EU demand.",
        "Analyse the correlation between diesel price changes and cold storage costs for potato in Agra region over the last 3 years.",
        "What is the seasonal price curve for sugarcane at Kolhapur mandi and what is the optimal selling window for farmers?",
        "Forecast the impact of El Niño-Southern Oscillation on cotton commodity prices and acreage for the upcoming Kharif season.",
    ],
    3: [  # gemma:7b — Soil Health Analyst
        "Soil lab report: pH 5.2, N=68 kg/ha (LOW), P=14 kg/ha (MEDIUM), K=210 kg/ha (HIGH), OC=0.38%, Zn=0.4 ppm. Crop: Kharif Paddy. Suggest amendment plan.",
        "My soil EC is 4.8 dS/m. How do I manage high salinity for growing vegetables in coastal Odisha? What amendments and varieties work?",
        "Soil test shows severe Zinc deficiency at 0.3 ppm. Recommend the exact application rate, timing, and method for wheat crop in Uttar Pradesh.",
        "How do I improve water-holding capacity in sandy loam soil in Rajasthan for groundnut cultivation under limited irrigation?",
        "My soil pH is 8.6 (strongly alkaline). What gypsum dose and schedule do I apply to grow acidic-loving crop like blueberry commercially?",
        "Organic carbon is 0.21% in my field. Design a complete green manuring and compost programme for a 3-year soil health restoration plan.",
    ],
    4: [  # codellama — Code Review
        "Review this FastAPI endpoint:\n```python\n@app.get('/users/{id}')\nasync def get_user(id: int, db=Depends(get_db)):\n    return db.query(User).filter(User.id == id).first().__dict__\n```",
        "Check this SQLAlchemy ORM code for N+1 query anti-pattern and suggest the correct eager loading fix:\n```python\nusers = session.query(User).all()\nfor u in users:\n    print(u.workspace.name)\n```",
        "Review this JWT middleware for security vulnerabilities. It decodes the token but does not verify expiry or issuer claims.",
        "This React useEffect fetches data on every render. Review for missing dependency array and unnecessary re-fetch issue.",
        "Analyse this Python data processing function for O(n²) complexity bottleneck when handling 500k row agricultural dataset.",
        "Review this PostgreSQL query — explain plan shows sequential scan on task_queue despite status index being defined.",
    ],
    5: [  # gemma:2b — FastAPI Doc Writer
        "Write complete OpenAPI docstring for DELETE /workspaces/{id} endpoint that cascade-deletes all agents, tasks, and logs.",
        "Generate Google-style docstrings for an async SQLAlchemy service function performing a 3-table JOIN with GROUP BY aggregation.",
        "Write a comprehensive README Authentication section documenting the JWT Bearer token flow for a FastAPI + Next.js app.",
        "Document the Pydantic v2 AgentConfigCreate schema including all field constraints, validators, and usage examples.",
        "Generate example curl commands and response JSON for a paginated agent listing endpoint with workspace_id filter.",
        "Write module-level docstring for the FastAPI analytics router including the SQL query it executes and performance notes.",
    ],
    6: [  # phi3:mini — Git Commit Agent
        "Added bcrypt password hashing with passlib, replaced all plain-text password storage, updated auth service and tests.",
        "Migrated database schema management to Alembic with async env.py, removed SQLAlchemy create_all() from application startup.",
        "Replaced useEffect data fetching with TanStack Query v5 across all dashboard pages, added skeleton loaders and stale-while-revalidate.",
        "Fixed N+1 query in workspace listing endpoint by adding selectinload for agents relationship, reduces DB round-trips from 21 to 1.",
        "Containerised Next.js app with 3-stage Dockerfile using standalone output mode, added health check and non-root user for security.",
        "Added Zod validation schemas for all frontend forms, synced field constraints with Pydantic backend schemas, removed duplicate logic.",
        "Implemented custom FastAPI exception handlers for 5 domain errors, standardised JSON error envelope across all error responses.",
        "Added Framer Motion AnimatePresence to AgentCard grid for enter/exit animations, fixed layout shift on card deletion.",
    ],
    7: [  # mistral:7b — Research Summarizer
        "Summarise 'Attention Is All You Need' (Vaswani et al. 2017). Focus on practical applicability for NLP in multilingual Indian agricultural advisory.",
        "Analyse and summarise this ICRISAT 2023 report on climate-resilient sorghum and pearl millet varieties for dryland farming in Deccan Plateau.",
        "Summarise recent computer vision research on automated paddy disease detection using mobile phone cameras for real-time field diagnosis.",
        "Extract and structure the key economic impact findings from this World Bank 2024 report on digital extension services in rural South Asia.",
        "Summarise this Nature paper on soil microbiome diversity and its correlation with crop productivity in smallholder farming systems.",
    ],
    8: [  # phi3 — Model Quality Benchmarking
        "Evaluate this Saathi agent response about late blight in potato crop for factual accuracy and hallucination risk.",
        "Score this market analysis response on onion price trends — check economic coherence and forecast methodology soundness.",
        "Benchmark this codellama code review output: does it correctly identify the SQL injection vector and propose a parameterised fix?",
        "Evaluate this research summarisation output against the original ICRISAT paper abstract for completeness and factual fidelity.",
        "Assess this soil health recommendation response — are the NPK dosages within agronomically established safe limits for the crop?",
    ],
    9: [  # llama3 — Data Analysis Interpretation
        "Interpret: Yield regression R²=0.847, p=0.003, β_rainfall=0.62, β_fertilizer=0.38. Sample: 1200 farmer plots in Punjab.",
        "A Random Forest model achieved 89.3% accuracy predicting crop yield from satellite imagery. Explain this result to the State Agriculture Commissioner.",
        "Interpret this confusion matrix from our plant disease detection CNN: TP=847, FP=43, FN=62, TN=1204. Provide precision, recall, and F1.",
        "The A/B test shows 12.3% yield improvement with AI advisory (n=500 treatment, n=500 control, p=0.002). What does this mean for policy?",
        "Translate this one-way ANOVA output comparing four biofertilizer treatments (F=18.7, df=3, p<0.001) into a procurement recommendation.",
        "K-means clustering identified 4 farmer segments. Segment 3 (n=1847) shows high area + low yield. What targeted intervention do you recommend?",
    ],
}

# ── Task distribution per agent: (n_completed, n_failed, n_pending) ───────────
# Total: 46 completed + 9 failed + 10 pending = 65 tasks

TASK_DISTRIBUTION: list[tuple[int, int, int]] = [
    (8, 2, 2),   # Agent 0: llama3 / Saathi — highest traffic, core production agent
    (5, 1, 1),   # Agent 1: llama3:8b / Disease Dx
    (6, 1, 1),   # Agent 2: mistral / Market Price
    (4, 1, 1),   # Agent 3: gemma:7b / Soil Health
    (3, 2, 1),   # Agent 4: codellama / Code Review — 2 failures (complex tasks, timeouts)
    (5, 0, 1),   # Agent 5: gemma:2b / Doc Writer — 100% success rate (simple tasks)
    (6, 0, 1),   # Agent 6: phi3:mini / Git Commits — very reliable, ultra-fast
    (4, 1, 1),   # Agent 7: mistral:7b / Research
    (3, 0, 1),   # Agent 8: phi3 / Benchmarking
    (5, 1, 1),   # Agent 9: llama3 / Data Analysis
]


# ── Realistic response templates ──────────────────────────────────────────────

_RESPONSE_TEMPLATES = [
    (
        "## Analysis Report\n\n"
        "**Primary Finding:** {conclusion}\n\n"
        "**Key Factors Identified:**\n"
        "1. {f1}\n2. {f2}\n3. {f3}\n\n"
        "**Recommended Action:** {rec}\n\n"
        "*Confidence Level: {conf}% | Analysis Timestamp: {ts}*"
    ),
    (
        "Based on the information provided, {conclusion}.\n\n"
        "The analysis reveals three critical considerations:\n"
        "- **Primary driver:** {f1}\n"
        "- **Contributing factor:** {f2}\n"
        "- **Contextual variable:** {f3}\n\n"
        "**Recommendation:** {rec}"
    ),
    (
        "### Expert Assessment\n\n"
        "**Summary:** {conclusion}.\n\n"
        "| Factor | Assessment |\n"
        "|--------|------------|\n"
        "| Primary | {f1} |\n"
        "| Secondary | {f2} |\n"
        "| Tertiary | {f3} |\n\n"
        "**Action Required:** {rec}\n\n"
        "_Confidence: {conf}% | Model: {model}_"
    ),
]

_CONCLUSIONS = [
    "the data strongly supports a targeted intervention at the input-supply level",
    "multiple compounding factors are driving the observed outcome, requiring a systems-level response",
    "the pattern is consistent with established agronomic literature and carries high diagnostic confidence",
    "the evidence indicates a moderate-severity condition with a well-understood remediation pathway",
    "the analysis reveals significant regional variance that must be accounted for in any recommendation",
    "the proposed approach aligns with ICAR protocols and carries a strong evidentiary basis",
    "a phased implementation strategy is optimal given the resource constraints identified",
    "the root cause is definitively attributable to the primary variable with 87% confidence",
]

_FACTORS = [
    "soil pH deviation from the optimal 6.0–7.0 range is the primary limiting factor",
    "historical rainfall deficit of 23% over the past 45 days has stressed the crop's nutrient uptake",
    "the observed symptom progression is consistent with a latent infection activated by high humidity",
    "genetic susceptibility of the deployed variety significantly amplifies the observed impact",
    "input application timing was misaligned with the critical growth stage by approximately 12 days",
    "prevailing market forces are exerting a 34% premium above the 5-year seasonal average",
    "soil organic carbon below 0.5% is severely limiting microbial activity and nutrient mineralisation",
    "the K:Mg ratio imbalance is antagonising calcium uptake despite adequate soil calcium levels",
]

_RECOMMENDATIONS = [
    "initiate targeted foliar application within 72 hours for maximum efficacy at this growth stage",
    "conduct a confirmatory soil test before proceeding to avoid over-application of amendments",
    "pilot the intervention on 15% of the field area and monitor response for 10 days before scaling",
    "coordinate with the local KVK agronomist for on-site verification given the severity indicated",
    "implement in conjunction with improved drainage management to prevent recurrence next season",
    "document photographic evidence now to support any crop insurance claim under PMFBY",
    "the cost-benefit analysis strongly favours immediate treatment over a wait-and-watch strategy",
    "prioritise this action in the next 48–72 hours — the intervention window is time-sensitive",
]


def _make_response(model_name: str) -> str:
    template = random.choice(_RESPONSE_TEMPLATES)
    return template.format(
        conclusion=random.choice(_CONCLUSIONS),
        f1=random.choice(_FACTORS),
        f2=random.choice(_FACTORS),
        f3=random.choice(_FACTORS),
        rec=random.choice(_RECOMMENDATIONS),
        conf=random.randint(74, 97),
        ts=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        model=model_name,
    )


def _exec_time_ms(avg: int, std: int) -> int:
    """Gaussian execution time, clipped to a realistic range."""
    raw = int(random.gauss(avg, std))
    lo  = max(100,          avg - 3 * std)
    hi  = min(avg + 3 * std, 12_000)
    return int(max(lo, min(raw, hi)))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN SEEDER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def seed_database() -> None:
    banner("AgentRegistry — Production Demo Seeder")

    force = "--force" in sys.argv

    async with AsyncSessionFactory() as session:

        # ── Guard: idempotency check ──────────────────────────────────────────
        result = await session.execute(
            select(User).where(User.username == USERS[0]["username"])
        )
        already_seeded = result.scalar_one_or_none() is not None

        if already_seeded and not force:
            warn(f"Database already contains seed user '{USERS[0]['username']}'.")
            warn("Re-run with --force to wipe and re-seed:")
            print(f"\n  {CYAN}docker compose exec backend python -m app.db.seed --force{RESET}\n")
            return

        if already_seeded and force:
            section("Force mode — removing existing seed data…")
            # Delete in FK-safe order (child → parent)
            for Model in [ExecutionLog, TaskQueue, AgentConfig, Workspace, User]:
                await session.execute(delete(Model))
            await session.commit()
            ok("Existing data cleared.\n")

        # ── STEP 1: Users ─────────────────────────────────────────────────────
        section("Creating users…")
        created_users: list[User] = []

        for u in USERS:
            user = User(
                username=u["username"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                created_at=(
                    datetime.now(timezone.utc) - timedelta(days=random.randint(14, 45))
                ),
            )
            session.add(user)
            created_users.append(user)

        await session.flush()
        for i, user in enumerate(created_users):
            label = "ADMIN   " if user.role == UserRole.ADMIN else "STANDARD"
            ok(
                f"[{label}] {CYAN}{user.username}{RESET} (id={user.id})"
                f"  password={CYAN}{USERS[i]['password']}{RESET}"
            )
        print()

        # ── STEP 2: Workspaces ────────────────────────────────────────────────
        section("Creating workspaces…")
        created_workspaces: list[Workspace] = []

        for ws_def in WORKSPACES:
            owner = created_users[ws_def["owner_index"]]
            ws = Workspace(
                user_id=owner.id,
                name=ws_def["name"],
                description=ws_def["description"],
            )
            session.add(ws)
            created_workspaces.append(ws)

        await session.flush()
        for ws in created_workspaces:
            print(f"  {GREEN}✓{RESET}  '{ws.name}' (id={ws.id})  owner_id={ws.user_id}")
            ok(f"'{ws.name}' (id={ws.id})  owner_id={ws.user_id}")
            info(ws.description[:80] + "…")
        print()

        # ── STEP 3: Agent Configurations ──────────────────────────────────────
        section("Creating agent configurations…")
        created_agents: list[AgentConfig] = []

        for a_def in AGENTS:
            ws = created_workspaces[a_def["workspace_index"]]
            agent = AgentConfig(
                workspace_id=ws.id,
                model_name=a_def["model_name"],
                system_prompt=a_def["system_prompt"],
                temperature=a_def["temperature"],
            )
            session.add(agent)
            created_agents.append(agent)

        await session.flush()
        for i, agent in enumerate(created_agents):
            ws_name = created_workspaces[AGENTS[i]["workspace_index"]].name
            ok(
                f"[{agent.model_name:<15}] temp={agent.temperature:.2f}"
                f"  →  workspace='{ws_name}' (agent_id={agent.id})"
            )
        print()

        # ── STEP 4: Tasks + Execution Logs ────────────────────────────────────
        section("Creating task queue entries and execution logs…")
        print()

        total_tasks     = 0
        total_completed = 0
        total_failed    = 0
        total_pending   = 0
        total_logs      = 0

        # Spread historical tasks across the last 21 days
        window_start = datetime.now(timezone.utc) - timedelta(days=21)

        for agent_idx, (n_comp, n_fail, n_pend) in enumerate(TASK_DISTRIBUTION):
            agent    = created_agents[agent_idx]
            a_def    = AGENTS[agent_idx]
            prompts  = PROMPT_POOL.get(agent_idx, ["Analyse and provide insights."])
            n_total  = n_comp + n_fail + n_pend

            print(
                f"  {BOLD}Agent {agent_idx + 1:02d}{RESET} [{CYAN}{agent.model_name:<15}{RESET}]"
                f"  {n_total} tasks"
                f"  ({GREEN}{n_comp} completed{RESET}"
                f" / {RED}{n_fail} failed{RESET}"
                f" / {YELLOW}{n_pend} pending{RESET})"
            )

            prompt_idx = 0

            # ── COMPLETED ────────────────────────────────────────────────────
            for _ in range(n_comp):
                exec_ms = _exec_time_ms(a_def["avg_ms"], a_def["std_ms"])

                # Spread completed tasks across the historical window
                offset    = timedelta(
                    hours=random.uniform(0, 21 * 24),
                    minutes=random.uniform(0, 59),
                )
                task_time = window_start + offset
                log_time  = task_time + timedelta(
                    milliseconds=exec_ms + random.randint(80, 400)
                )

                prompt = prompts[prompt_idx % len(prompts)]
                prompt_idx += 1

                task = TaskQueue(
                    agent_id=agent.id,
                    prompt_text=prompt,
                    status=TaskStatus.COMPLETED,
                    created_at=task_time,
                )
                session.add(task)
                await session.flush()

                log_entry = ExecutionLog(
                    task_id=task.id,
                    response_text=_make_response(agent.model_name),
                    execution_time_ms=exec_ms,
                    timestamp=log_time,
                )
                session.add(log_entry)
                await session.flush()

                total_logs      += 1
                total_completed += 1
                total_tasks     += 1

                info(
                    f"COMPLETED  task={task.id:>3}  "
                    f"{exec_ms:>5}ms  "
                    f"{prompt[:52]}…"
                )

            # ── FAILED ───────────────────────────────────────────────────────
            for _ in range(n_fail):
                offset    = timedelta(hours=random.uniform(0, 21 * 24))
                task_time = window_start + offset
                prompt    = prompts[prompt_idx % len(prompts)]
                prompt_idx += 1

                task = TaskQueue(
                    agent_id=agent.id,
                    prompt_text=prompt,
                    status=TaskStatus.FAILED,
                    created_at=task_time,
                )
                session.add(task)
                await session.flush()

                total_failed += 1
                total_tasks  += 1

                info(f"FAILED     task={task.id:>3}          {prompt[:52]}…")

            # ── PENDING ──────────────────────────────────────────────────────
            for _ in range(n_pend):
                # Pending tasks are very recent (within the last 90 minutes)
                offset    = timedelta(minutes=random.uniform(2, 90))
                task_time = datetime.now(timezone.utc) - offset
                prompt    = prompts[prompt_idx % len(prompts)]
                prompt_idx += 1

                task = TaskQueue(
                    agent_id=agent.id,
                    prompt_text=prompt,
                    status=TaskStatus.PENDING,
                    created_at=task_time,
                )
                session.add(task)
                await session.flush()

                total_pending += 1
                total_tasks   += 1

                info(f"PENDING    task={task.id:>3}          {prompt[:52]}…")

            print()

        # ── Commit all records atomically ─────────────────────────────────────
        await session.commit()

        # ── Final report ──────────────────────────────────────────────────────
        banner("SEED COMPLETE — Database is demo-ready!", GREEN)

        col_w = 28
        print(f"  {'Users created:':<{col_w}}{len(created_users)}")
        print(f"  {'Workspaces created:':<{col_w}}{len(created_workspaces)}")
        print(f"  {'Agents created:':<{col_w}}{len(created_agents)}")
        print(f"  {'Total tasks:':<{col_w}}{total_tasks}")
        print(f"  {'  ✓ Completed:':<{col_w}}{GREEN}{total_completed}{RESET}")
        print(f"  {'  ✗ Failed:':<{col_w}}{RED}{total_failed}{RESET}")
        print(f"  {'  ◌ Pending:':<{col_w}}{YELLOW}{total_pending}{RESET}")
        print(f"  {'Execution logs:':<{col_w}}{total_logs}")
        print()

        print(f"  {BOLD}Login Credentials:{RESET}")
        for i, user in enumerate(created_users):
            role  = "Admin   " if user.role == UserRole.ADMIN else "Standard"
            uname = f"{CYAN}{user.username}{RESET}"
            pwd   = f"{CYAN}{USERS[i]['password']}{RESET}"
            print(f"    [{role}]  username: {uname}   password: {pwd}")

        print()
        print(f"  {BOLD}Analytics JOIN will now return:{RESET}")
        model_names = list({a["model_name"] for a in AGENTS})
        for m in sorted(model_names):
            count = sum(1 for a in AGENTS if a["model_name"] == m)
            print(f"    {CYAN}{m:<18}{RESET} — {count} agent(s) with varied avg_ms")

        print()
        print(f"  {BOLD}Open:{RESET}")
        print(f"    Dashboard  →  {CYAN}http://localhost:3000{RESET}")
        print(f"    Analytics  →  {CYAN}http://localhost:3000/analytics{RESET}")
        print(f"    API Docs   →  {CYAN}http://localhost:8000/api/docs{RESET}")
        print()


def main() -> None:
    asyncio.run(seed_database())


if __name__ == "__main__":
    main()