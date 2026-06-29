import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from decision_platform import init_decision_tables, review_recommendation, run_decision_workflow

load_dotenv()

class DecisionRequest(BaseModel):
    interaction: str
    userid: str = "guest@accurate.ai"
    sessionid: str | None = None

class RecommendationReview(BaseModel):
    recommendation_id: str
    status: str
    note: str | None = None

app = FastAPI(title="Accurate DecisionOS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_decision_tables()

@app.post("/decision/run")
async def decision_run(request: DecisionRequest):
    if not request.interaction.strip():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="interaction is required")
    try:
        return run_decision_workflow(
            content=request.interaction,
            user_email=request.userid,
            session_id=request.sessionid,
        )
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/decision/review")
async def decision_review(request: RecommendationReview):
    try:
        return review_recommendation(
            recommendation_id=request.recommendation_id,
            status=request.status,
            note=request.note,
        )
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "Accurate DecisionOS is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)