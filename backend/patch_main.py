import re

with open("main.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix Imports
if "DoctorProfile" not in content:
    content = content.replace("ChatMessage", "ChatMessage, DoctorProfile, MealLog, WorkoutLog, ClinicalNote")

# 2. Add Fitness Endpoints
fitness_endpoints = """
class MealLogRequest(BaseModel):
    meal_type: str
    calories: int
    description: str = ""

@app.post("/fitness/{user_id}/meal")
def log_meal(user_id: int, req: MealLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    meal = MealLog(user_id=user_id, date=today, meal_type=req.meal_type, calories=req.calories, description=req.description)
    db.add(meal)
    db.commit()
    return {"status": "success"}

class WorkoutLogRequest(BaseModel):
    activity: str
    duration_minutes: int
    calories_burned: int

@app.post("/fitness/{user_id}/workout")
def log_workout(user_id: int, req: WorkoutLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    workout = WorkoutLog(user_id=user_id, date=today, activity=req.activity, duration_minutes=req.duration_minutes, calories_burned=req.calories_burned)
    db.add(workout)
    db.commit()
    return {"status": "success"}

@app.post("/fitness/{user_id}/sync_wearable")
def sync_wearable(user_id: int, db: Session = Depends(get_db)):
    # Simulate importing 7 days of data
    import random
    from datetime import datetime, timedelta
    for i in range(7):
        date_str = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        log = db.query(FitnessLog).filter(FitnessLog.user_id == user_id, FitnessLog.date == date_str).first()
        if not log:
            log = FitnessLog(
                user_id=user_id, 
                date=date_str, 
                steps=random.randint(6000, 12000), 
                sleep_hours=random.uniform(6.0, 8.5), 
                water_glasses=random.randint(4, 9),
                hrv_score=random.randint(40, 80)
            )
            db.add(log)
    db.commit()
    return {"status": "success", "message": "Synced 7 days of wearable data"}
"""

if "log_meal" not in content:
    content = content.replace("@app.post(\"/fitness/{user_id}/sleep\")", fitness_endpoints + "\n\n@app.post(\"/fitness/{user_id}/sleep\")")

with open("main.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated main.py successfully")
