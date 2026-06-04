import json
import io
import os
import shutil
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from PIL import Image

# Import your custom modules
from database import SessionLocal, Product, User, CartItem, BioResource, Transaction, MedicalKnowledge, Prescription, MedicalRecord, Appointment, MedicationLog, FitnessLog, ChatMessage, DoctorProfile, AmbulanceBooking
AGENT_ERROR = None
try:
    from agent_genai import GenAIMedicalAgent
    AGENT_AVAILABLE = True
except Exception as e:
    AGENT_AVAILABLE = False
    AGENT_ERROR = str(e)
    print(f"[WARNING] AI Agent not available: {e}")

app = FastAPI()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve the uploads directory statically so files can be downloaded/viewed
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- CORS CONFIGURATION (Allow React / Mobile / Production) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 1. INITIALIZATION ---
@app.post("/init-db")
def init_db_endpoint():
    return {"status": "System Online. Run 'python seed_data.py' to populate data."}

# --- 2. AI CHATBOT ---
class ChatRequest(BaseModel):
    patient_id: int
    message: str

@app.post("/chat/clinical")
def chat_clinical(req: ChatRequest, db: Session = Depends(get_db)):
    if not AGENT_AVAILABLE:
        return {"reply": f"[Warning] AI Copilot is offline. Reason: {AGENT_ERROR}", "action": None}
    agent = GenAIMedicalAgent(db)
    return agent.process_message(req.patient_id, req.message, mode="clinical")

@app.post("/chat/copilot")
def chat_copilot(req: ChatRequest, db: Session = Depends(get_db)):
    if not AGENT_AVAILABLE:
        return {"reply": f"[Warning] AI Copilot is offline. Reason: {AGENT_ERROR}", "action": None}
    agent = GenAIMedicalAgent(db)
    return agent.process_message(req.patient_id, req.message, mode="copilot")


@app.post("/chat/ai")
def chat_ai(req: ChatRequest, db: Session = Depends(get_db)):
    if not AGENT_AVAILABLE:
        return {"reply": f"[Warning] AI Copilot is offline. Reason: {AGENT_ERROR}", "action": None}
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

# --- 3. MULTI-ORGAN AI SCANNER (GEMINI VISION) ---
@app.post("/scan/{organ}")
async def scan_endpoint(organ: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not AGENT_AVAILABLE:
        return {"error": "AI Agent is offline. Cannot perform scan."}
        
    try:
        # Read the uploaded image bytes
        image_data = await file.read()
        mime_type = file.content_type or "image/jpeg"
        
        # Pass to our GenAI agent for analysis
        agent = GenAIMedicalAgent(db)
        result = agent.analyze_image(image_bytes=image_data, organ=organ, mime_type=mime_type)
        
        # Result should already be a JSON dictionary with diagnosis, confidence, severity, details
        return result
        
    except Exception as e:
        return {"error": f"Scan failed: {str(e)}"}

# --- 4. STORE & BIO-BANK API ---
@app.get("/products")
def get_products(search: str = "", db: Session = Depends(get_db)):
    query = db.query(Product)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return query.limit(50).all()

@app.get("/bio-resources")
def get_bio(db: Session = Depends(get_db)):
    return {
        "blood": db.query(BioResource).filter(BioResource.type == "Blood").all(),
        "organs": db.query(BioResource).filter(BioResource.type == "Organ").all()
    }

# --- 5. CART & PAYMENTS ---
@app.get("/cart/{user_id}")
def get_cart(user_id: int, db: Session = Depends(get_db)):
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    return [{"id": i.product.id, "name": i.product.name, "price": i.product.price, "quantity": i.quantity} for i in items]

@app.post("/cart/add/{user_id}/{product_id}")
def add_cart(user_id: int, product_id: int, db: Session = Depends(get_db)):
    existing = db.query(CartItem).filter_by(user_id=user_id, product_id=product_id).first()
    if existing: existing.quantity += 1
    else: db.add(CartItem(user_id=user_id, product_id=product_id, quantity=1))
    db.commit()
    return {"status": "ok"}

@app.post("/cart/remove/{user_id}/{product_id}")
def remove_cart(user_id: int, product_id: int, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter_by(user_id=user_id, product_id=product_id).first()
    if item:
        if item.quantity > 1: item.quantity -= 1
        else: db.delete(item)
        db.commit()
    return {"status": "ok"}

@app.post("/pay/{user_id}")
def pay(user_id: int, db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.add(Transaction(user_id=user_id, amount=0.0, status="Success", method="Credit Card"))
    db.commit()
    return {"status": "success"}

# --- 6. MEDICAL RECORDS API (Replaces Vault) ---
@app.post("/records/{user_id}")
async def upload_record(user_id: int, file: UploadFile = File(...), doctor: str = Form("Dr. Vani"), title: str = Form(None), db: Session = Depends(get_db)):
    if not title:
        title = file.filename
    
    file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{int(datetime.now().timestamp())}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    ext = file.filename.split(".")[-1].upper()
    
    new_record = MedicalRecord(
        user_id=user_id,
        type="Uploaded Document",
        title=title,
        doctor=doctor,
        date=datetime.now().strftime("%b %d, %Y"),
        file_type=ext,
        file_path=file_path,
        summary=None
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {"status": "success", "record_id": new_record.id, "file_path": file_path}

@app.delete("/records/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    if record.file_path and os.path.exists(record.file_path):
        try:
            os.remove(record.file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")
            
    db.delete(record)
    db.commit()
    return {"status": "success"}

class SummarizeRequest(BaseModel):
    patient_id: int

@app.post("/records/{record_id}/summarize")
def summarize_record(record_id: int, req: SummarizeRequest, db: Session = Depends(get_db)):
    if not AGENT_AVAILABLE:
        return {"summary": "AI Agent is currently offline. Cannot summarize."}
        
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # We use Gemini to generate a summary based on the document title and type
    agent = GenAIMedicalAgent(db)
    prompt = f"The patient has a medical record titled '{record.title}' of type '{record.file_type}'. Briefly explain what this kind of document generally contains and what the patient should look out for. Keep it simple and reassuring (max 3 sentences)."
    
    response = agent.llm.invoke(prompt)
    summary_text = response.content if hasattr(response, 'content') else str(response)
    
    record.summary = summary_text
    db.commit()
    
    return {"summary": summary_text}


# --- 7. PRESCRIPTIONS & MEDICATION TRACKER API ---
@app.get("/prescriptions/{user_id}")
def get_prescriptions(user_id: int, db: Session = Depends(get_db)):
    prescriptions = db.query(Prescription).filter(Prescription.user_id == user_id).all()
    today = datetime.now().strftime("%Y-%m-%d")
    
    result = []
    for p in prescriptions:
        # Check if logged today
        log = db.query(MedicationLog).filter(MedicationLog.prescription_id == p.id, MedicationLog.date == today).first()
        result.append({
            "id": p.id,
            "drug_name": p.drug_name,
            "dosage": p.dosage,
            "frequency": p.frequency,
            "days_left": p.days_left,
            "is_critical": p.is_critical,
            "taken_today": log.taken if log else False
        })
    return result

class MedLogRequest(BaseModel):
    taken: bool

@app.post("/prescriptions/{user_id}/log/{prescription_id}")
def log_medication(user_id: int, prescription_id: int, req: MedLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    log = db.query(MedicationLog).filter(MedicationLog.prescription_id == prescription_id, MedicationLog.date == today).first()
    
    if log:
        log.taken = req.taken
    else:
        log = MedicationLog(user_id=user_id, prescription_id=prescription_id, date=today, taken=req.taken)
        db.add(log)
        
    db.commit()
    return {"status": "success", "taken": req.taken}


# --- 8. APPOINTMENTS API ---
@app.get("/doctors")
def get_doctors(db: Session = Depends(get_db)):
    docs = db.query(User).filter(User.role == "doctor").all()
    res = []
    for d in docs:
        prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == d.id).first()
        res.append({
            "id": d.id,
            "name": d.name,
            "specialty": prof.specialty if prof else "General",
            "fee": prof.consultation_fee if prof else 100.0,
            "rating": prof.rating if prof else 5.0
        })
    return res

@app.get("/appointments/{user_id}")
def get_appointments(user_id: int, db: Session = Depends(get_db)):
    appointments = db.query(Appointment).filter(Appointment.user_id == user_id).all()
    return [
        {
            "id": a.id,
            "doctor": a.doctor,
            "date": a.date,
            "time": a.time,
            "type": a.type,
            "status": a.status,
            "fee": a.fee
        } for a in appointments
    ]

class AppointmentCreate(BaseModel):
    user_id: int
    doctor_id: int
    doctor: str
    date: str
    time: str
    type: str
    symptoms: str = ""

@app.post("/appointments")
def create_appointment(app_req: AppointmentCreate, db: Session = Depends(get_db)):
    prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == app_req.doctor_id).first()
    fee = prof.consultation_fee if prof else 100.0
    
    # Simple symptom triage
    triage_score = 0
    if "pain" in app_req.symptoms.lower(): triage_score += 3
    if "fever" in app_req.symptoms.lower(): triage_score += 2
    if "severe" in app_req.symptoms.lower(): triage_score += 5
    
    new_app = Appointment(
        user_id=app_req.user_id,
        doctor=app_req.doctor,
        doctor_id=app_req.doctor_id,
        date=app_req.date,
        time=app_req.time,
        type=app_req.type,
        status="Pending",
        fee=fee,
        symptoms=app_req.symptoms,
        triage_score=triage_score
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return {"status": "success", "appointment_id": new_app.id, "fee": fee, "triage_score": triage_score}

@app.put("/appointments/{app_id}/status")
def update_appointment_status(app_id: int, status: str, db: Session = Depends(get_db)):
    app = db.query(Appointment).filter(Appointment.id == app_id).first()
    if app:
        app.status = status
        db.commit()
        return {"status": "success"}
    return {"status": "error"}


# --- 9. PATIENTS API ---
@app.get("/patients")
def get_patients(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role != "doctor").all()
    result = []
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    for u in users:
        # Real prescription counts
        presc_count = db.query(Prescription).filter(Prescription.user_id == u.id).count()
        critical_count = db.query(Prescription).filter(Prescription.user_id == u.id, Prescription.is_critical == True).count()
        
        # Real appointment data for 'lastVisit' and 'condition'
        appointments = db.query(Appointment).filter(Appointment.user_id == u.id).order_by(Appointment.date.desc()).all()
        
        last_visit = "No Visits"
        condition = "Stable"
        
        if appointments:
            latest = appointments[0]
            if latest.date >= today_str:
                condition = f"Upcoming {latest.type} Appt"
                if len(appointments) > 1:
                    last_visit = appointments[1].date # Previous visit
            else:
                last_visit = latest.date
                
        if critical_count > 0:
            condition = "Active Critical Prescriptions"
        
        result.append({
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "prescriptions": presc_count,
            "risk": "High" if critical_count > 0 else "Low",
            "condition": condition,
            "lastVisit": last_visit
        })
    return result


class PatientCreate(BaseModel):
    name: str
    condition: str = "New Assessment"

@app.post("/patients")
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    new_user = User(name=patient.name, role="patient")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "name": new_user.name, "role": new_user.role, "risk": "Low", "condition": patient.condition, "lastVisit": "Just now"}


# --- 9. DASHBOARD SUMMARY ---
@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    prescriptions = db.query(Prescription).filter(Prescription.user_id == user_id).all()
    critical_meds = [p for p in prescriptions if p.is_critical]
    cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    records = db.query(MedicalRecord).filter(MedicalRecord.user_id == user_id).all()

    # Generate realistic dynamic telemetry data for charts (last 24 data points)
    import random
    base_hr = 75 if not critical_meds else 88
    hr_data = [{"time": f"{i}:00", "bpm": base_hr + random.randint(-8, 12)} for i in range(24)]
    
    base_sys = 120 if not critical_meds else 135
    base_dia = 80 if not critical_meds else 88
    bp_data = [{"time": f"{i}:00", "systolic": base_sys + random.randint(-5, 10), "diastolic": base_dia + random.randint(-4, 6)} for i in range(24)]
    
    health_score = 100 - (len(critical_meds) * 15) - (len(prescriptions) * 5)
    health_score = max(30, health_score)

    return {
        "user_name": user.name,
        "medsCount": len(prescriptions),
        "alerts": len(critical_meds),
        "cartTotal": len(cart_items),
        "recordsCount": len(records),
        "healthScore": health_score,
        "telemetry": {
            "heartRate": hr_data,
            "bloodPressure": bp_data
        },
        "prescriptions": [
            {"drug_name": p.drug_name, "dosage": p.dosage, "frequency": p.frequency, "days_left": p.days_left, "is_critical": p.is_critical}
            for p in prescriptions
        ]
    }

@app.get("/telemetry/{user_id}/live")
def get_live_telemetry(user_id: int, db: Session = Depends(get_db)):
    # Simulates a real-time hardware sensor pinging the backend
    import random
    from datetime import datetime
    
    prescriptions = db.query(Prescription).filter(Prescription.user_id == user_id).all()
    critical_meds = [p for p in prescriptions if p.is_critical]
    
    base_hr = 75 if not critical_meds else 88
    base_sys = 120 if not critical_meds else 135
    base_dia = 80 if not critical_meds else 88
    
    current_time = datetime.now().strftime("%H:%M:%S")
    
    return {
        "time": current_time,
        "bpm": base_hr + random.randint(-4, 6),
        "systolic": base_sys + random.randint(-3, 5),
        "diastolic": base_dia + random.randint(-2, 4)
    }


# --- 10. MEDICAL RECORDS ---
@app.get("/records/{user_id}")
def get_records(user_id: int, db: Session = Depends(get_db)):
    records = db.query(MedicalRecord).filter(MedicalRecord.user_id == user_id).all()
    return [
        {"id": r.id, "type": r.type, "title": r.title, "doctor": r.doctor, "date": r.date, "file_type": r.file_type}
        for r in records
    ]


# --- 11. USER PROFILE ---
@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "role": user.role}

# --- 12. FITNESS & GOALS API ---
@app.get("/fitness/{user_id}")
def get_fitness(user_id: int, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    log = db.query(FitnessLog).filter(FitnessLog.user_id == user_id, FitnessLog.date == today).first()
    if not log:
        # Create empty log for today with 0 values instead of mock data
        log = FitnessLog(user_id=user_id, date=today, steps=0, sleep_hours=0.0, water_glasses=0)
        db.add(log)
        db.commit()
        db.refresh(log)
        
    return {
        "date": log.date,
        "steps": log.steps,
        "sleep_hours": round(log.sleep_hours, 1),
        "water_glasses": log.water_glasses
    }

class FitnessLogRequest(BaseModel):
    value: float

@app.post("/fitness/{user_id}/steps")
def log_steps(user_id: int, req: FitnessLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    log = db.query(FitnessLog).filter(FitnessLog.user_id == user_id, FitnessLog.date == today).first()
    if log:
        log.steps = int(req.value)
        db.commit()
        db.refresh(log)
        return {"status": "success", "steps": log.steps}
    return {"status": "error", "detail": "Fitness log not found"}

# --- 13. DOCTOR-PATIENT CHAT API ---
@app.get("/chat/{user_id}/{doctor_id}")
def get_chat_messages(user_id: int, doctor_id: int, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ((ChatMessage.sender_id == user_id) & (ChatMessage.receiver_id == doctor_id)) |
        ((ChatMessage.sender_id == doctor_id) & (ChatMessage.receiver_id == user_id))
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "timestamp": m.timestamp.isoformat() + "Z" if m.timestamp else None
        } for m in messages
    ]

class ChatMessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    content: str

@app.post("/chat/send")
def send_chat_message(msg: ChatMessageCreate, db: Session = Depends(get_db)):
    new_msg = ChatMessage(
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        content=msg.content
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    # Use Gemini AI to simulate the doctor's response
    if AGENT_AVAILABLE and msg.sender_id != msg.receiver_id:
        try:
            agent = GenAIMedicalAgent(db)
            doctor = db.query(User).filter(User.id == msg.receiver_id).first()
            doc_name = doctor.name if doctor else "the Doctor"
            
            prompt = f"You are {doc_name}, a medical professional chatting with a patient. Respond to the patient's message. Keep it short, helpful, and professional. Patient: '{msg.content}'"
            response = agent.llm.invoke(prompt)
            ai_text = response.content if hasattr(response, 'content') else str(response)
            
            bot_reply = ChatMessage(
                sender_id=msg.receiver_id,
                receiver_id=msg.sender_id,
                content=ai_text
            )
            db.add(bot_reply)
            db.commit()
        except Exception as e:
            print(f"Chatbot error: {e}")

    return {"status": "success", "message_id": new_msg.id}

class PrescriptionRouteRequest(BaseModel):
    user_id: int
    drug_name: str
    dosage: str
    frequency: str
    days_left: int
    is_critical: bool
    pharmacy_route: str

@app.post("/prescriptions/route")
def route_prescription(req: PrescriptionRouteRequest, db: Session = Depends(get_db)):
    new_presc = Prescription(
        user_id=req.user_id,
        drug_name=req.drug_name,
        dosage=req.dosage,
        frequency=req.frequency,
        days_left=req.days_left,
        is_critical=req.is_critical,
        pharmacy_route=req.pharmacy_route
    )
    db.add(new_presc)
    db.commit()
    db.refresh(new_presc)
    return {"status": "success", "prescription_id": new_presc.id}



class MealLogRequest(BaseModel):
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


@app.post("/fitness/{user_id}/sleep")
def log_sleep(user_id: int, req: FitnessLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    log = db.query(FitnessLog).filter(FitnessLog.user_id == user_id, FitnessLog.date == today).first()
    if log:
        log.sleep_hours = req.value
        db.commit()
        db.refresh(log)
        return {"status": "success", "sleep_hours": round(log.sleep_hours, 1)}
    return {"status": "error", "detail": "Fitness log not found"}

@app.post("/fitness/{user_id}/water")
def log_water(user_id: int, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    log = db.query(FitnessLog).filter(FitnessLog.user_id == user_id, FitnessLog.date == today).first()
    if log:
        log.water_glasses += 1
        db.commit()
        db.refresh(log)
        return {"status": "success", "water_glasses": log.water_glasses}
    return {"status": "error", "detail": "Fitness log not found"}


# =====================================================
# --- 14. AMBULANCE BOOKING API ---
# =====================================================
class AmbulanceRequest(BaseModel):
    user_id: int
    patient_name: str
    pickup_address: str
    emergency_type: str
    notes: str = ""

AMBULANCE_FLEET = [
    {"id": "AMB-042", "driver": "Rajesh Kumar", "phone": "+91 98765 43210"},
    {"id": "AMB-017", "driver": "Priya Sharma", "phone": "+91 98123 45678"},
    {"id": "AMB-031", "driver": "Suresh Patel", "phone": "+91 97890 12345"},
    {"id": "AMB-008", "driver": "Anita Singh", "phone": "+91 96543 21098"},
]

@app.post("/ambulance/book")
def book_ambulance(req: AmbulanceRequest, db: Session = Depends(get_db)):
    vehicle = random.choice(AMBULANCE_FLEET)
    eta = random.randint(6, 15)
    booking = AmbulanceBooking(
        user_id=req.user_id,
        patient_name=req.patient_name,
        pickup_address=req.pickup_address,
        emergency_type=req.emergency_type,
        status="Dispatched",
        eta_minutes=eta,
        ambulance_id=vehicle["id"],
        driver_name=vehicle["driver"],
        driver_phone=vehicle["phone"],
        notes=req.notes
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {
        "status": "success",
        "booking_id": booking.id,
        "ambulance_id": booking.ambulance_id,
        "driver_name": booking.driver_name,
        "driver_phone": booking.driver_phone,
        "eta_minutes": booking.eta_minutes,
        "message": f"Ambulance {booking.ambulance_id} dispatched. ETA: {eta} minutes."
    }

@app.get("/ambulance/history/{user_id}")
def get_ambulance_history(user_id: int, db: Session = Depends(get_db)):
    bookings = db.query(AmbulanceBooking).filter(AmbulanceBooking.user_id == user_id).order_by(AmbulanceBooking.timestamp.desc()).all()
    return [
        {
            "id": b.id,
            "patient_name": b.patient_name,
            "pickup_address": b.pickup_address,
            "emergency_type": b.emergency_type,
            "status": b.status,
            "eta_minutes": b.eta_minutes,
            "ambulance_id": b.ambulance_id,
            "driver_name": b.driver_name,
            "driver_phone": b.driver_phone,
            "timestamp": b.timestamp.isoformat() if b.timestamp else None
        } for b in bookings
    ]

@app.put("/ambulance/{booking_id}/status")
def update_ambulance_status(booking_id: int, status: str, db: Session = Depends(get_db)):
    booking = db.query(AmbulanceBooking).filter(AmbulanceBooking.id == booking_id).first()
    if booking:
        booking.status = status
        db.commit()
        return {"status": "success"}
    return {"status": "error", "detail": "Booking not found"}


# =====================================================
# --- 15. NEARBY DOCTORS MAP API ---
# =====================================================

# =====================================================
# --- 15. NEARBY FACILITIES - Real Overpass API Proxy ---
# =====================================================
import urllib.request

@app.get("/nearby-facilities")
def get_nearby_facilities(lat: float, lng: float, radius: int = 5000):
    """
    Server-side proxy to OpenStreetMap Overpass API.
    Fetches real hospitals and clinics near the given coordinates.
    Returns raw Overpass elements array.
    """
    query = f"""
[out:json][timeout:30];
(
  node["amenity"="hospital"](around:{radius},{lat},{lng});
  node["amenity"="clinic"](around:{radius},{lat},{lng});
  node["amenity"="doctors"](around:{radius},{lat},{lng});
  node["healthcare"="hospital"](around:{radius},{lat},{lng});
  node["healthcare"="clinic"](around:{radius},{lat},{lng});
  way["amenity"="hospital"](around:{radius},{lat},{lng});
  way["amenity"="clinic"](around:{radius},{lat},{lng});
  relation["amenity"="hospital"](around:{radius},{lat},{lng});
);
out center;
"""
    try:
        encoded = query.encode("utf-8")
        req = urllib.request.Request(
            "https://overpass-api.de/api/interpreter",
            data=encoded,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        with urllib.request.urlopen(req, timeout=35) as resp:
            import json as json_mod
            data = json_mod.loads(resp.read().decode("utf-8"))
            return {"elements": data.get("elements", []), "source": "openstreetmap"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Overpass API error: {str(e)}")


# Keep old endpoint for backwards compat (now unused by frontend)
@app.get("/nearby-doctors")
def get_nearby_doctors():
    return {"message": "Use /nearby-facilities?lat=LAT&lng=LNG for real OpenStreetMap data."}