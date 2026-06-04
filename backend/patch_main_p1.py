import re

with open("main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace log_meal to include macros
old_meal_log = """class MealLogRequest(BaseModel):
    meal_type: str
    calories: int
    description: str = ""

@app.post("/fitness/{user_id}/meal")
def log_meal(user_id: int, req: MealLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    meal = MealLog(user_id=user_id, date=today, meal_type=req.meal_type, calories=req.calories, description=req.description)
    db.add(meal)
    db.commit()
    return {"status": "success"}"""

new_meal_log = """class MealLogRequest(BaseModel):
    meal_type: str
    calories: int
    protein: int = 0
    carbs: int = 0
    fats: int = 0
    description: str = ""

@app.post("/fitness/{user_id}/meal")
def log_meal(user_id: int, req: MealLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    meal = MealLog(user_id=user_id, date=today, meal_type=req.meal_type, calories=req.calories, protein=req.protein, carbs=req.carbs, fats=req.fats, description=req.description)
    db.add(meal)
    db.commit()
    return {"status": "success"}"""

if old_meal_log in content:
    content = content.replace(old_meal_log, new_meal_log)

# Add AI endpoint and History endpoint
new_endpoints = """
@app.post("/chat/ai")
def chat_ai(req: ChatRequest, db: Session = Depends(get_db)):
    if not AGENT_AVAILABLE:
        return {"reply": "AI Agent offline — langchain-ollama not installed.", "action": None}
    agent = GenAIMedicalAgent(db)
    return agent.process_message(req.patient_id, req.message, mode="copilot")

@app.get("/fitness/{user_id}/history")
def get_fitness_history(user_id: int, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    result = []
    for i in range(6, -1, -1):
        date_obj = datetime.now() - timedelta(days=i)
        date_str = date_obj.strftime("%Y-%m-%d")
        day_str = date_obj.strftime("%a")
        log = db.query(FitnessLog).filter(FitnessLog.user_id == user_id, FitnessLog.date == date_str).first()
        if log:
            result.append({"day": day_str, "steps": log.steps, "hrv": log.hrv_score or 55, "sleep": log.sleep_hours})
        else:
            result.append({"day": day_str, "steps": 0, "hrv": 55, "sleep": 0})
    return result

@app.get("/orders/{user_id}")
def get_orders(user_id: int, db: Session = Depends(get_db)):
    # Mocking order history for now
    return [
        {"id": 1001, "date": "2023-10-01", "total": 45.99, "status": "Delivered"},
        {"id": 1024, "date": "2023-11-15", "total": 12.50, "status": "Shipped"}
    ]
"""

if "def chat_ai" not in content:
    content = content.replace("# --- 3. MULTI-ORGAN AI SCANNER (GEMINI VISION) ---", new_endpoints + "\n# --- 3. MULTI-ORGAN AI SCANNER (GEMINI VISION) ---")

with open("main.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated main.py successfully with phase 1 backend endpoints")
