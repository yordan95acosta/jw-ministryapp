from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to hash PIN
def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()

# Define Models
class ProfileCreate(BaseModel):
    name: str
    pin: str  # 4-6 digit PIN

class ProfileLogin(BaseModel):
    name: str
    pin: str

class Profile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pin_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProfileResponse(BaseModel):
    id: str
    name: str
    created_at: datetime

class EntryCreate(BaseModel):
    profile_id: str
    date: str  # YYYY-MM-DD format
    hours: int = 0
    minutes: int = 0
    study_person_name: Optional[str] = None  # Name of person studied with
    notes: Optional[str] = None

class Entry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    date: str
    hours: int = 0
    minutes: int = 0
    study_person_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GoalCreate(BaseModel):
    profile_id: str
    year: int
    month: int  # 1-12
    hours_goal: int  # Target hours for the month

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    year: int
    month: int
    hours_goal: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MonthlySummary(BaseModel):
    year: int
    month: int
    total_hours: int
    total_minutes: int
    unique_studies: int  # Count of unique person names
    study_names: List[str]  # List of unique names
    hours_goal: int
    entries_count: int

class ExportData(BaseModel):
    entries: List[dict]
    goals: List[dict]
    export_date: str

class ImportData(BaseModel):
    entries: List[dict]
    goals: List[dict]

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Ministry Hours Tracker API"}

# Entry endpoints
@api_router.post("/entries", response_model=Entry)
async def create_entry(entry_data: EntryCreate):
    entry = Entry(**entry_data.dict())
    await db.entries.insert_one(entry.dict())
    return entry

@api_router.get("/entries", response_model=List[Entry])
async def get_entries(year: Optional[int] = None, month: Optional[int] = None):
    query = {}
    if year and month:
        # Filter by year-month prefix in date string
        month_str = f"{year}-{month:02d}"
        query["date"] = {"$regex": f"^{month_str}"}
    
    entries = await db.entries.find(query).sort("date", -1).to_list(1000)
    return [Entry(**entry) for entry in entries]

@api_router.get("/entries/date/{date}", response_model=List[Entry])
async def get_entries_by_date(date: str):
    entries = await db.entries.find({"date": date}).to_list(100)
    return [Entry(**entry) for entry in entries]

@api_router.put("/entries/{entry_id}", response_model=Entry)
async def update_entry(entry_id: str, entry_data: EntryCreate):
    result = await db.entries.find_one({"id": entry_id})
    if not result:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    update_data = entry_data.dict()
    await db.entries.update_one({"id": entry_id}, {"$set": update_data})
    
    updated = await db.entries.find_one({"id": entry_id})
    return Entry(**updated)

@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str):
    result = await db.entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted successfully"}

# Goal endpoints
@api_router.post("/goals", response_model=Goal)
async def set_goal(goal_data: GoalCreate):
    # Check if goal exists for this month/year
    existing = await db.goals.find_one({
        "year": goal_data.year,
        "month": goal_data.month
    })
    
    if existing:
        # Update existing goal
        await db.goals.update_one(
            {"year": goal_data.year, "month": goal_data.month},
            {"$set": {"hours_goal": goal_data.hours_goal}}
        )
        updated = await db.goals.find_one({"year": goal_data.year, "month": goal_data.month})
        return Goal(**updated)
    else:
        # Create new goal
        goal = Goal(**goal_data.dict())
        await db.goals.insert_one(goal.dict())
        return goal

@api_router.get("/goals/{year}/{month}", response_model=Optional[Goal])
async def get_goal(year: int, month: int):
    goal = await db.goals.find_one({"year": year, "month": month})
    if goal:
        return Goal(**goal)
    return None

# Monthly summary endpoint
@api_router.get("/summary/{year}/{month}", response_model=MonthlySummary)
async def get_monthly_summary(year: int, month: int):
    month_str = f"{year}-{month:02d}"
    
    # Get all entries for the month
    entries = await db.entries.find({"date": {"$regex": f"^{month_str}"}}).to_list(1000)
    
    # Calculate totals
    total_minutes = 0
    study_names = set()
    
    for entry in entries:
        total_minutes += entry.get("hours", 0) * 60 + entry.get("minutes", 0)
        if entry.get("study_person_name"):
            # Normalize name (lowercase, strip) for unique counting
            name = entry["study_person_name"].strip().lower()
            if name:
                study_names.add(name)
    
    total_hours = total_minutes // 60
    remaining_minutes = total_minutes % 60
    
    # Get goal for the month
    goal = await db.goals.find_one({"year": year, "month": month})
    hours_goal = goal["hours_goal"] if goal else 30  # Default 30 hours
    
    return MonthlySummary(
        year=year,
        month=month,
        total_hours=total_hours,
        total_minutes=remaining_minutes,
        unique_studies=len(study_names),
        study_names=list(study_names),
        hours_goal=hours_goal,
        entries_count=len(entries)
    )

# History endpoint - get all months with data
@api_router.get("/history")
async def get_history():
    # Get all unique year-month combinations
    entries = await db.entries.find({}, {"date": 1}).to_list(10000)
    
    months_data = {}
    for entry in entries:
        date_str = entry.get("date", "")
        if len(date_str) >= 7:
            year_month = date_str[:7]  # YYYY-MM
            if year_month not in months_data:
                parts = year_month.split("-")
                if len(parts) == 2:
                    year, month = int(parts[0]), int(parts[1])
                    months_data[year_month] = {"year": year, "month": month}
    
    # Sort by date descending
    sorted_months = sorted(months_data.values(), key=lambda x: (x["year"], x["month"]), reverse=True)
    
    # Get summary for each month
    history = []
    for m in sorted_months:
        summary = await get_monthly_summary(m["year"], m["month"])
        history.append(summary)
    
    return history

# Export endpoint
@api_router.get("/export")
async def export_data():
    entries = await db.entries.find().to_list(10000)
    goals = await db.goals.find().to_list(1000)
    
    # Convert datetime objects to strings for JSON serialization
    for entry in entries:
        if "_id" in entry:
            del entry["_id"]
        if "created_at" in entry and isinstance(entry["created_at"], datetime):
            entry["created_at"] = entry["created_at"].isoformat()
    
    for goal in goals:
        if "_id" in goal:
            del goal["_id"]
        if "created_at" in goal and isinstance(goal["created_at"], datetime):
            goal["created_at"] = goal["created_at"].isoformat()
    
    return {
        "entries": entries,
        "goals": goals,
        "export_date": datetime.utcnow().isoformat()
    }

# Import endpoint
@api_router.post("/import")
async def import_data(data: ImportData):
    imported_entries = 0
    imported_goals = 0
    
    # Import entries
    for entry_data in data.entries:
        # Check if entry with same id exists
        if "id" in entry_data:
            existing = await db.entries.find_one({"id": entry_data["id"]})
            if existing:
                continue  # Skip duplicates
        
        # Create new entry
        if "id" not in entry_data:
            entry_data["id"] = str(uuid.uuid4())
        if "created_at" not in entry_data:
            entry_data["created_at"] = datetime.utcnow()
        elif isinstance(entry_data["created_at"], str):
            entry_data["created_at"] = datetime.fromisoformat(entry_data["created_at"].replace("Z", "+00:00"))
        
        await db.entries.insert_one(entry_data)
        imported_entries += 1
    
    # Import goals
    for goal_data in data.goals:
        # Check if goal for this year/month exists
        existing = await db.goals.find_one({
            "year": goal_data.get("year"),
            "month": goal_data.get("month")
        })
        if existing:
            continue  # Skip if goal already exists for this month
        
        if "id" not in goal_data:
            goal_data["id"] = str(uuid.uuid4())
        if "created_at" not in goal_data:
            goal_data["created_at"] = datetime.utcnow()
        elif isinstance(goal_data["created_at"], str):
            goal_data["created_at"] = datetime.fromisoformat(goal_data["created_at"].replace("Z", "+00:00"))
        
        await db.goals.insert_one(goal_data)
        imported_goals += 1
    
    return {
        "message": "Import completed",
        "imported_entries": imported_entries,
        "imported_goals": imported_goals
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
