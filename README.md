# Intelligent Next Best Action Platform

A reusable Agentic Decision Intelligence Platform that transforms customer interactions and enterprise knowledge into actionable recommendations. Built for Hackathon Project 2, this platform intelligently determines next best actions by combining contextual understanding, organizational knowledge, and business reasoning.

## 🎯 Hackathon Context

**Objective:** Design and build a reusable agentic platform (not just a chatbot or RAG application) that assists business users in making better decisions through explainable AI.

**Business Domain:** Staffing and Background Screening
- Customer journey: Background check requests → Screening processing → Discrepancy resolution → Onboarding decision
- Decision points: Escalation triggers, compliance holds, discrepancy handling, customer updates
- Success metrics: SLA compliance, risk mitigation, decision accuracy

## 🏗️ Architecture

### 7-Agent Planner-Based Orchestration

1. **Planner Agent** - Orchestrates the entire workflow and decomposes requests
2. **Interaction Ingestion Agent** - Extracts signals from customer interactions (emails, meeting notes, CRM updates)
3. **Customer Context Agent** - Retrieves operational data from enterprise databases
4. **Knowledge Retrieval Agent** - Matches relevant playbooks, policies, and best practices
5. **Risk & Opportunity Agent** - Analyzes business context for risks, opportunities, and missing information
6. **Recommendation Agent** - Generates ranked next-best actions with confidence scores
7. **Human Review Agent** - Supports approve/reject/edit workflow with human-in-the-loop
8. **Memory Agent** - Stores decision patterns for continuous learning

### Tech Stack

**Backend:**
- Python 3.x
- FastAPI (REST API)
- SQLite (operational data & decision memory)
- MCP (Model Context Protocol) for database access

**Frontend:**
- Next.js 15 (React 19)
- TypeScript
- TailwindCSS
- shadcn/ui components
- Lucide icons

**AI/ML:**
- Hugging Face API integration (optional)
- Rule-based agent orchestration
- Signal extraction and pattern matching

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt