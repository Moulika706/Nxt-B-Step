import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

DB_PATH = os.path.join(os.path.dirname(__file__), "accurate.db")

KNOWLEDGE_BASE = [
    {
        "id": "kb-sla-pending",
        "title": "Pending search escalation playbook",
        "type": "Operations Playbook",
        "content": "Escalate searches that remain pending beyond the customer SLA or where onboarding is blocked by a pending component.",
        "tags": ["pending", "sla", "escalation", "onboarding"],
    },
    {
        "id": "kb-discrepancy",
        "title": "Employment discrepancy response",
        "type": "Compliance Best Practice",
        "content": "When an employment discrepancy appears, request candidate clarification and keep the customer update factual until adjudication is complete.",
        "tags": ["employment", "discrepancy", "candidate", "compliance"],
    },
    {
        "id": "kb-customer-update",
        "title": "Customer status update guidance",
        "type": "Customer Success Playbook",
        "content": "Customer updates should include current status, blocking items, owner, expected next checkpoint, and any information needed from the customer or candidate.",
        "tags": ["customer", "update", "status", "communication"],
    },
    {
        "id": "kb-proceed-risk",
        "title": "Proceeding before completion",
        "type": "Risk Policy",
        "content": "Do not recommend final clearance while criminal, MVR, or compliance-sensitive searches are pending or discrepant.",
        "tags": ["clearance", "criminal", "mvr", "risk", "pending"],
    },
]


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_decision_tables() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS interactions (
                interaction_id TEXT PRIMARY KEY,
                user_email TEXT,
                customer_name TEXT,
                subject_name TEXT,
                channel TEXT,
                content TEXT NOT NULL,
                signals_json TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS recommendations (
                recommendation_id TEXT PRIMARY KEY,
                interaction_id TEXT NOT NULL,
                title TEXT NOT NULL,
                action TEXT NOT NULL,
                priority TEXT NOT NULL,
                confidence REAL NOT NULL,
                reasoning TEXT NOT NULL,
                evidence_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending_review',
                created_at TEXT NOT NULL,
                reviewed_at TEXT,
                review_note TEXT,
                FOREIGN KEY (interaction_id) REFERENCES interactions(interaction_id)
            );

            CREATE TABLE IF NOT EXISTS memory_events (
                memory_id TEXT PRIMARY KEY,
                interaction_id TEXT,
                recommendation_id TEXT,
                event_type TEXT NOT NULL,
                summary TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        conn.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _rows(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with _connect() as conn:
        return [dict(row) for row in conn.execute(sql, params).fetchall()]


def _one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    rows = _rows(sql, params)
    return rows[0] if rows else None


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def ingest_interaction(content: str) -> dict[str, Any]:
    text = _normalize(content)
    lowered = text.lower()
    signals = []
    if any(word in lowered for word in ["urgent", "escalat", "blocked", "customer is asking", "proceed"]):
        signals.append("customer_escalation")
    if any(word in lowered for word in ["pending", "waiting", "stuck", "delay", "delayed"]):
        signals.append("pending_or_delay")
    if any(word in lowered for word in ["discrepancy", "mismatch", "unable to verify", "adverse"]):
        signals.append("discrepancy")
    if any(word in lowered for word in ["criminal", "county", "mvr", "motor vehicle"]):
        signals.append("compliance_sensitive_search")
    if any(word in lowered for word in ["missing", "need info", "clarification", "candidate"]):
        signals.append("missing_information")

    subject_match = re.search(r"(?:candidate|subject)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})", text)
    company_match = re.search(r"(?:customer|company|client)\s+([A-Z][A-Za-z0-9&.\- ]{2,40})", text)

    return {
        "summary": text[:220] + ("..." if len(text) > 220 else ""),
        "signals": signals or ["general_decision_request"],
        "subject_name": subject_match.group(1) if subject_match else None,
        "customer_name": company_match.group(1).strip() if company_match else None,
        "urgency": "high" if "urgent" in lowered or "blocked" in lowered or "escalat" in lowered else "medium",
    }


def gather_customer_context(signals: list[str], subject_name: str | None) -> dict[str, Any]:
    subject_filter = ""
    params: tuple[Any, ...] = ()
    if subject_name:
        subject_filter = "WHERE lower(s.subject_name) LIKE ?"
        params = (f"%{subject_name.lower()}%",)

    orders = _rows(
        f"""
        SELECT
            o.order_id,
            o.order_packageid,
            o.order_status,
            ss.status AS order_status_label,
            s.subject_name,
            c.comp_name,
            c.comp_code,
            p.package_name,
            p.package_price,
            COUNT(se.searchid) AS search_count,
            SUM(CASE WHEN se.search_status = 'P' THEN 1 ELSE 0 END) AS pending_searches,
            SUM(CASE WHEN lower(COALESCE(se.sub_status, '')) LIKE '%discrep%' THEN 1 ELSE 0 END) AS discrepancy_searches
        FROM order_request o
        LEFT JOIN subject s ON s.subject_id = o.order_subjectid
        LEFT JOIN company c ON c.comp_code = o.order_companycode
        LEFT JOIN "package" p ON p.package_code = o.order_packagecode
        LEFT JOIN search_status ss ON ss.status_code = o.order_status
        LEFT JOIN search se ON se.package_req_id = o.order_packageid
        {subject_filter}
        GROUP BY o.order_id
        ORDER BY pending_searches DESC, discrepancy_searches DESC, o.order_id DESC
        LIMIT 6
        """,
        params,
    )

    search_mix = _rows(
        """
        SELECT st.search_type AS name, COUNT(*) AS value
        FROM search se
        LEFT JOIN search_type st ON st.search_type_code = se.search_type_code
        GROUP BY st.search_type
        ORDER BY value DESC
        LIMIT 5
        """
    )

    status_mix = _rows(
        """
        SELECT COALESCE(ss.status, se.search_status) AS name, COUNT(*) AS value
        FROM search se
        LEFT JOIN search_status ss ON ss.status_code = se.search_status
        GROUP BY COALESCE(ss.status, se.search_status)
        ORDER BY value DESC
        LIMIT 5
        """
    )

    memory = _rows(
        """
        SELECT event_type, summary, created_at
        FROM memory_events
        ORDER BY created_at DESC
        LIMIT 5
        """
    )

    return {
        "orders": orders,
        "search_mix": search_mix,
        "status_mix": status_mix,
        "memory": memory,
        "scope": "subject_match" if subject_name and orders else "portfolio_scan",
        "signals": signals,
    }


def retrieve_knowledge(signals: list[str], text: str) -> list[dict[str, str]]:
    haystack = set(signals + re.findall(r"[a-z]{4,}", text.lower()))
    scored = []
    for item in KNOWLEDGE_BASE:
        score = len(haystack.intersection(item["tags"]))
        if score:
            scored.append((score, item))
    if not scored:
        scored = [(1, KNOWLEDGE_BASE[2])]
    return [item for _, item in sorted(scored, key=lambda pair: pair[0], reverse=True)[:3]]


def analyze_risks(interaction: dict[str, Any], context: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    risks = []
    opportunities = []
    missing = []

    high_risk_orders = [
        order for order in context["orders"]
        if (order.get("pending_searches") or 0) > 0 or (order.get("discrepancy_searches") or 0) > 0
    ]

    if "pending_or_delay" in interaction["signals"] or high_risk_orders:
        risks.append({
            "label": "SLA and onboarding delay risk",
            "detail": "One or more orders have pending components that may block customer decisions.",
        })
    if "discrepancy" in interaction["signals"] or any((o.get("discrepancy_searches") or 0) > 0 for o in context["orders"]):
        risks.append({
            "label": "Discrepancy handling risk",
            "detail": "A discrepancy may require candidate clarification and careful customer communication.",
        })
    if "compliance_sensitive_search" in interaction["signals"]:
        risks.append({
            "label": "Compliance-sensitive search risk",
            "detail": "Criminal, county, or MVR work should be completed before final clearance decisions.",
        })
    if not interaction.get("subject_name"):
        missing.append({
            "label": "Candidate identifier",
            "detail": "The interaction does not clearly identify the candidate or subject record.",
        })
    if not interaction.get("customer_name"):
        missing.append({
            "label": "Customer account",
            "detail": "The customer or company name is not explicit in the interaction.",
        })

    opportunities.append({
        "label": "Proactive customer update",
        "detail": "The user can send a status update with blockers, owner, and next checkpoint.",
    })
    if context["memory"]:
        opportunities.append({
            "label": "Reuse past operating pattern",
            "detail": "Recent human-reviewed recommendations are available as decision memory.",
        })

    return {"risks": risks, "opportunities": opportunities, "missing_information": missing}


def _evidence(context: dict[str, Any], knowledge: list[dict[str, str]], extra: str) -> list[dict[str, str]]:
    evidence = [{"source": "Business Signal", "detail": extra}]
    for order in context["orders"][:2]:
        evidence.append({
            "source": "Operational Database",
            "detail": f"Order {order.get('order_packageid')} for {order.get('subject_name') or 'subject'} has {order.get('pending_searches') or 0} pending and {order.get('discrepancy_searches') or 0} discrepant searches.",
        })
    for item in knowledge[:2]:
        evidence.append({"source": item["title"], "detail": item["content"]})
    return evidence


def recommend_actions(interaction: dict[str, Any], context: dict[str, Any], knowledge: list[dict[str, str]], analysis: dict[str, Any]) -> list[dict[str, Any]]:
    recommendations = []
    signals = interaction["signals"]
    risky_order = next((order for order in context["orders"] if (order.get("pending_searches") or 0) > 0), None)

    if "pending_or_delay" in signals or risky_order:
        recommendations.append({
            "title": "Escalate pending search components",
            "action": "Assign an operations owner to review the pending searches, confirm blockers, and provide a next checkpoint to the customer.",
            "priority": "high",
            "confidence": 0.88,
            "reasoning": "The planner found pending or delayed work that can affect onboarding readiness. Escalation is the fastest controlled action because it creates ownership without bypassing compliance.",
            "evidence": _evidence(context, knowledge, "Interaction contains delay or pending-search signals."),
        })

    if "discrepancy" in signals or any((o.get("discrepancy_searches") or 0) > 0 for o in context["orders"]):
        recommendations.append({
            "title": "Request candidate clarification on discrepancy",
            "action": "Send a focused clarification request to the candidate and attach the response to the order before advising the customer on final next steps.",
            "priority": "high",
            "confidence": 0.84,
            "reasoning": "A discrepancy changes the decision path. The safest next action is to collect missing evidence from the candidate and preserve an auditable trail.",
            "evidence": _evidence(context, knowledge, "Interaction or order context indicates a discrepancy."),
        })

    if "compliance_sensitive_search" in signals:
        recommendations.append({
            "title": "Hold final clearance until sensitive searches complete",
            "action": "Tell the business user that onboarding can be prepared, but final clearance should wait until criminal, county, or MVR searches are complete.",
            "priority": "medium",
            "confidence": 0.79,
            "reasoning": "The knowledge policy says not to recommend final clearance while compliance-sensitive searches are pending or discrepant.",
            "evidence": _evidence(context, knowledge, "Interaction mentions a compliance-sensitive search type."),
        })

    recommendations.append({
        "title": "Send evidence-backed customer update",
        "action": "Send a concise update with current status, blocking items, action owner, and the next review time.",
        "priority": "medium",
        "confidence": 0.76,
        "reasoning": "The platform found customer-facing uncertainty. A structured update reduces escalation pressure while preserving decision quality.",
        "evidence": _evidence(context, knowledge, "Customer communication is useful for this decision state."),
    })

    if analysis["missing_information"]:
        recommendations.append({
            "title": "Capture missing decision inputs",
            "action": "Ask for the missing customer, candidate, order ID, or desired business outcome before executing high-impact actions.",
            "priority": "low",
            "confidence": 0.71,
            "reasoning": "The planner detected incomplete identifiers. Filling these gaps improves retrieval precision and reduces the chance of acting on the wrong case.",
            "evidence": [{"source": "Interaction Ingestion Agent", "detail": item["detail"]} for item in analysis["missing_information"]],
        })

    return recommendations[:4]


def run_decision_workflow(content: str, user_email: str, session_id: str | None = None) -> dict[str, Any]:
    init_decision_tables()
    interaction = ingest_interaction(content)
    context = gather_customer_context(interaction["signals"], interaction.get("subject_name"))
    knowledge = retrieve_knowledge(interaction["signals"], content)
    analysis = analyze_risks(interaction, context)
    recommendations = recommend_actions(interaction, context, knowledge, analysis)

    interaction_id = f"int_{uuid4().hex[:12]}"
    created_at = _now()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO interactions (
                interaction_id, user_email, customer_name, subject_name, channel,
                content, signals_json, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                interaction_id,
                user_email,
                interaction.get("customer_name"),
                interaction.get("subject_name"),
                "workspace",
                content,
                json.dumps(interaction["signals"]),
                created_at,
            ),
        )

        stored_recommendations = []
        for rec in recommendations:
            rec_id = f"rec_{uuid4().hex[:12]}"
            conn.execute(
                """
                INSERT INTO recommendations (
                    recommendation_id, interaction_id, title, action, priority,
                    confidence, reasoning, evidence_json, status, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?)
                """,
                (
                    rec_id,
                    interaction_id,
                    rec["title"],
                    rec["action"],
                    rec["priority"],
                    rec["confidence"],
                    rec["reasoning"],
                    json.dumps(rec["evidence"]),
                    created_at,
                ),
            )
            stored_recommendations.append({"id": rec_id, "status": "pending_review", **rec})

        conn.execute(
            """
            INSERT INTO memory_events (memory_id, interaction_id, event_type, summary, created_at)
            VALUES (?, ?, 'workflow_run', ?, ?)
            """,
            (
                f"mem_{uuid4().hex[:12]}",
                interaction_id,
                f"Planner ran {len(stored_recommendations)} recommendations for signals: {', '.join(interaction['signals'])}.",
                created_at,
            ),
        )
        conn.commit()

    return {
        "interaction_id": interaction_id,
        "session_id": session_id,
        "planner_trace": [
            {"agent": "Planner Agent", "status": "complete", "output": "Decomposed the request into ingestion, retrieval, risk analysis, recommendation, explanation, review, and memory steps."},
            {"agent": "Interaction Ingestion Agent", "status": "complete", "output": f"Extracted signals: {', '.join(interaction['signals'])}."},
            {"agent": "Customer Context Agent", "status": "complete", "output": f"Retrieved {len(context['orders'])} relevant order records using {context['scope']}."},
            {"agent": "Knowledge Retrieval Agent", "status": "complete", "output": f"Matched {len(knowledge)} playbooks and policy references."},
            {"agent": "Risk and Opportunity Agent", "status": "complete", "output": f"Found {len(analysis['risks'])} risks, {len(analysis['opportunities'])} opportunities, and {len(analysis['missing_information'])} missing inputs."},
            {"agent": "Recommendation Agent", "status": "complete", "output": f"Generated {len(stored_recommendations)} ranked next-best actions."},
            {"agent": "Human Review Agent", "status": "waiting", "output": "Recommendations are waiting for approve, edit, or reject."},
            {"agent": "Memory Agent", "status": "complete", "output": "Stored workflow run as reusable decision memory."},
        ],
        "interaction": interaction,
        "analysis": analysis,
        "knowledge": knowledge,
        "context": context,
        "recommendations": stored_recommendations,
        "metrics": {
            "recommendation_count": len(stored_recommendations),
            "high_priority_count": len([rec for rec in stored_recommendations if rec["priority"] == "high"]),
            "evidence_count": sum(len(rec["evidence"]) for rec in stored_recommendations),
            "average_confidence": round(sum(rec["confidence"] for rec in stored_recommendations) / max(len(stored_recommendations), 1), 2),
        },
    }


def review_recommendation(recommendation_id: str, status: str, note: str | None = None) -> dict[str, Any]:
    init_decision_tables()
    allowed = {"approved", "rejected", "edited"}
    if status not in allowed:
        raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")

    reviewed_at = _now()
    with _connect() as conn:
        rec = conn.execute(
            "SELECT recommendation_id, interaction_id, title FROM recommendations WHERE recommendation_id = ?",
            (recommendation_id,),
        ).fetchone()
        if not rec:
            raise ValueError("recommendation not found")

        conn.execute(
            """
            UPDATE recommendations
            SET status = ?, reviewed_at = ?, review_note = ?
            WHERE recommendation_id = ?
            """,
            (status, reviewed_at, note, recommendation_id),
        )
        conn.execute(
            """
            INSERT INTO memory_events (
                memory_id, interaction_id, recommendation_id, event_type, summary, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                f"mem_{uuid4().hex[:12]}",
                rec["interaction_id"],
                recommendation_id,
                f"recommendation_{status}",
                f"Human reviewer marked '{rec['title']}' as {status}. {note or ''}".strip(),
                reviewed_at,
            ),
        )
        conn.commit()

    return {"recommendation_id": recommendation_id, "status": status, "reviewed_at": reviewed_at}
