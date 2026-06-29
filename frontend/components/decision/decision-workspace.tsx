"use client"

import type React from "react"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Brain,
  Check,
  ClipboardList,
  Database,
  FileSearch,
  History,
  Loader2,
  MessageSquareText,
  Pencil,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react"

type TraceItem = {
  agent: string
  status: "complete" | "waiting" | string
  output: string
}

type Evidence = {
  source: string
  detail: string
}

type Recommendation = {
  id: string
  title: string
  action: string
  priority: "high" | "medium" | "low" | string
  confidence: number
  reasoning: string
  evidence: Evidence[]
  status: string
}

type AnalysisItem = {
  label: string
  detail: string
}

type DecisionResult = {
  interaction_id: string
  planner_trace: TraceItem[]
  interaction: {
    summary: string
    signals: string[]
    urgency: string
    subject_name?: string | null
    customer_name?: string | null
  }
  analysis: {
    risks: AnalysisItem[]
    opportunities: AnalysisItem[]
    missing_information: AnalysisItem[]
  }
  knowledge: Array<{
    id: string
    title: string
    type: string
    content: string
  }>
  context: {
    orders: Array<Record<string, string | number | null>>
    search_mix: Array<{ name: string; value: number }>
    status_mix: Array<{ name: string; value: number }>
    memory: Array<{ event_type: string; summary: string; created_at: string }>
  }
  recommendations: Recommendation[]
  metrics: {
    recommendation_count: number
    high_priority_count: number
    evidence_count: number
    average_confidence: number
  }
}

const demoInteraction =
  "Customer BrightPath Staffing is asking whether they can proceed with onboarding. A candidate is pending for 6 days, the county screening is still pending, and an employment verification shows a discrepancy. The team needs the safest next action and a customer-ready update."

const priorityStyles: Record<string, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-slate-200 bg-slate-50 text-slate-700",
}

const statusStyles: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-700",
  waiting: "bg-amber-100 text-amber-700",
}

function toPercent(confidence: number) {
  return `${Math.round(confidence * 100)}%`
}

function DataBars({ data }: { data: Array<{ name: string; value: number }> }) {
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1)

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span className="truncate">{item.name || "Unknown"}</span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-teal-500"
              style={{ width: `${Math.max((Number(item.value) / max) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DecisionWorkspace() {
  const [interaction, setInteraction] = useState(demoInteraction)
  const [result, setResult] = useState<DecisionResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState("")
  const [reviewingId, setReviewingId] = useState("")

  const userEmail = "guest@accurate.ai"

  const topRecommendation = useMemo(() => {
    if (!result?.recommendations.length) return null
    return result.recommendations[0]
  }, [result])

  async function runWorkflow() {
    setIsRunning(true)
    setError("")

    try {
      const response = await fetch("/api/decision/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interaction,
          userid: userEmail,
          sessionid: "decision-workspace",
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Workflow failed")
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow failed")
    } finally {
      setIsRunning(false)
    }
  }

  async function reviewRecommendation(id: string, status: "approved" | "rejected" | "edited") {
    setReviewingId(id)
    setError("")

    try {
      const response = await fetch("/api/decision/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation_id: id,
          status,
          note: status === "edited" ? "Reviewer wants to adjust wording before execution." : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Review failed")
      }
      setResult((current) => {
        if (!current) return current
        return {
          ...current,
          recommendations: current.recommendations.map((rec) =>
            rec.id === id ? { ...rec, status } : rec,
          ),
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed")
    } finally {
      setReviewingId("")
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
                <Brain className="h-4 w-4" />
                Planner-based decision intelligence
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                Intelligent Next Best Action Platform
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Transform customer interactions, operational context, and enterprise knowledge into explainable next-best actions for onboarding, customer success, sales, or support workflows.
              </p>
            </div>

            <button
              type="button"
              onClick={runWorkflow}
              disabled={isRunning || !interaction.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Planner
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Domain</div>
              <div className="mt-1 text-sm font-semibold">Reusable B2B Workflow</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Decision Flow</div>
              <div className="mt-1 text-sm font-semibold">Plan, retrieve, reason, review</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Memory</div>
              <div className="mt-1 text-sm font-semibold">Human feedback loop</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">User</div>
              <div className="mt-1 truncate text-sm font-semibold">{userEmail}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <section className="space-y-5">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-teal-700" />
              <h2 className="text-sm font-semibold">Customer Interaction</h2>
            </div>
            <textarea
              value={interaction}
              onChange={(event) => setInteraction(event.target.value)}
              placeholder="Paste a customer issue, meeting note, CRM update, or support escalation..."
              className="min-h-[260px] w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Paste meeting notes, email, CRM update, or customer conversation..."
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInteraction(demoInteraction)}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Load Demo
              </button>
              <span className="text-xs text-slate-500">{interaction.length} characters</span>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-sky-700" />
              <h2 className="text-sm font-semibold">Enterprise Sources</h2>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span>Operational SQLite data</span>
                <span className="text-xs text-emerald-700">connected</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span>Screening playbooks</span>
                <span className="text-xs text-emerald-700">indexed</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span>Decision memory</span>
                <span className="text-xs text-emerald-700">learning</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!result ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="max-w-md">
                <Target className="mx-auto h-10 w-10 text-teal-600" />
                <h2 className="mt-4 text-lg font-semibold">Ready to orchestrate a business decision</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Run the planner to see specialized agents extract signals, retrieve context, identify risks, recommend next-best actions, and wait for human review.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Recommendations</div>
                  <div className="mt-2 text-2xl font-semibold">{result.metrics.recommendation_count}</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">High Priority</div>
                  <div className="mt-2 text-2xl font-semibold text-red-600">{result.metrics.high_priority_count}</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Evidence Points</div>
                  <div className="mt-2 text-2xl font-semibold">{result.metrics.evidence_count}</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Avg Confidence</div>
                  <div className="mt-2 text-2xl font-semibold text-teal-700">{toPercent(result.metrics.average_confidence)}</div>
                </div>
              </div>

              {topRecommendation && (
                <div className="rounded-md border border-teal-200 bg-teal-50 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-800">
                        <ShieldCheck className="h-4 w-4" />
                        Top Next-Best Action
                      </div>
                      <h2 className="text-lg font-semibold text-slate-950">{topRecommendation.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{topRecommendation.action}</p>
                    </div>
                    <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm">
                      {toPercent(topRecommendation.confidence)} confidence
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="space-y-5">
                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-indigo-700" />
                      <h2 className="text-sm font-semibold">Planner Trace</h2>
                    </div>
                    <div className="space-y-3">
                      {result.planner_trace.map((item) => (
                        <div key={item.agent} className="rounded-md border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">{item.agent}</div>
                            <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusStyles[item.status] || "bg-slate-100 text-slate-700"}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-5 text-slate-600">{item.output}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-700" />
                      <h2 className="text-sm font-semibold">Business Analysis</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <AnalysisColumn title="Risks" items={result.analysis.risks} />
                      <AnalysisColumn title="Opportunities" items={result.analysis.opportunities} />
                      <AnalysisColumn title="Missing Info" items={result.analysis.missing_information} />
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4 text-teal-700" />
                      <h2 className="text-sm font-semibold">Recommendations for Review</h2>
                    </div>
                    <div className="space-y-4">
                      {result.recommendations.map((rec) => (
                        <div key={rec.id} className="rounded-md border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold">{rec.title}</h3>
                                <span className={`rounded-md border px-2 py-1 text-xs font-medium ${priorityStyles[rec.priority] || priorityStyles.low}`}>
                                  {rec.priority}
                                </span>
                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                  {rec.status.replace("_", " ")}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{rec.action}</p>
                              <p className="mt-2 text-xs leading-5 text-slate-500">{rec.reasoning}</p>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <div className="text-lg font-semibold text-teal-700">{toPercent(rec.confidence)}</div>
                              <div className="text-xs text-slate-500">confidence</div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2">
                            {rec.evidence.slice(0, 3).map((item, index) => (
                              <div key={`${rec.id}-${index}`} className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                                <span className="font-semibold text-slate-900">{item.source}: </span>
                                {item.detail}
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <ReviewButton
                              icon={<Check className="h-3.5 w-3.5" />}
                              label="Approve"
                              disabled={reviewingId === rec.id}
                              onClick={() => reviewRecommendation(rec.id, "approved")}
                            />
                            <ReviewButton
                              icon={<Pencil className="h-3.5 w-3.5" />}
                              label="Edit"
                              disabled={reviewingId === rec.id}
                              onClick={() => reviewRecommendation(rec.id, "edited")}
                            />
                            <ReviewButton
                              icon={<X className="h-3.5 w-3.5" />}
                              label="Reject"
                              disabled={reviewingId === rec.id}
                              onClick={() => reviewRecommendation(rec.id, "rejected")}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="space-y-5">
                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <FileSearch className="h-4 w-4 text-sky-700" />
                      <h2 className="text-sm font-semibold">Retrieved Context</h2>
                    </div>
                    <div className="space-y-3">
                      {result.context.orders.slice(0, 4).map((order) => (
                        <div key={`${order.order_id}`} className="rounded-md bg-slate-50 p-3 text-sm">
                          <div className="font-semibold">{order.subject_name || "Subject"} · {order.order_packageid}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {order.comp_name || "Company"} · {order.package_name || "Package"} · {order.order_status_label || order.order_status}
                          </div>
                          <div className="mt-2 flex gap-2 text-xs">
                            <span className="rounded-md bg-white px-2 py-1 text-slate-700">Pending {String(order.pending_searches ?? 0)}</span>
                            <span className="rounded-md bg-white px-2 py-1 text-slate-700">Discrepancies {String(order.discrepancy_searches ?? 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Database className="h-4 w-4 text-teal-700" />
                      <h2 className="text-sm font-semibold">Search Status Mix</h2>
                    </div>
                    <DataBars data={result.context.status_mix} />
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <FileSearch className="h-4 w-4 text-indigo-700" />
                      <h2 className="text-sm font-semibold">Knowledge Evidence</h2>
                    </div>
                    <div className="space-y-3">
                      {result.knowledge.map((item) => (
                        <div key={item.id} className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-medium text-indigo-700">{item.type}</div>
                          <div className="mt-1 text-sm font-semibold">{item.title}</div>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <History className="h-4 w-4 text-slate-700" />
                      <h2 className="text-sm font-semibold">Decision Memory</h2>
                    </div>
                    {result.context.memory.length ? (
                      <div className="space-y-3">
                        {result.context.memory.map((item, index) => (
                          <div key={`${item.created_at}-${index}`} className="rounded-md bg-slate-50 p-3">
                            <div className="text-xs font-medium text-slate-500">{item.event_type}</div>
                            <p className="mt-1 text-xs leading-5 text-slate-700">{item.summary}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-slate-600">
                        Memory will populate as recommendations are generated and reviewed.
                      </p>
                    )}
                  </div>
                </aside>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function AnalysisColumn({ title, items }: { title: string; items: AnalysisItem[] }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-slate-500">{title}</div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={`${title}-${item.label}`} className="rounded-md bg-white p-3">
              <div className="text-sm font-semibold">{item.label}</div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
            </div>
          ))
        ) : (
          <div className="rounded-md bg-white p-3 text-xs text-slate-500">No major items detected.</div>
        )}
      </div>
    </div>
  )
}

function ReviewButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  )
}
