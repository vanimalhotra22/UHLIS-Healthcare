from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# --- CONFIGURATION ---
URL_DATABASE = "sqlite:///./uhlis.db"

engine = create_engine(URL_DATABASE, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 1. USERS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String) 
    cart_items = relationship("CartItem", back_populates="user")

# --- 2. INVENTORY ---
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    category = Column(String, index=True)
    stock = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    is_prescribed = Column(Boolean, default=False)
    cart_items = relationship("CartItem", back_populates="product")

# --- 3. BIO-BANK ---
class BioResource(Base):
    __tablename__ = "bio_resources"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) 
    name = Column(String)
    location = Column(String)
    contact = Column(String)
    quantity = Column(String)
    status = Column(String) 
    last_updated = Column(DateTime, default=datetime.utcnow)

# --- 4. MEDICAL RECORDS (The Missing Part) ---
class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String) # "Lab Report", "X-Ray"
    title = Column(String)
    doctor = Column(String)
    date = Column(String)
    file_type = Column(String) # "PDF", "JPG"
    file_path = Column(String, nullable=True)
    summary = Column(Text, nullable=True)

# --- 5. ACTIVE PRESCRIPTIONS (The Missing Part) ---
class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    drug_name = Column(String)
    dosage = Column(String) 
    frequency = Column(String) 
    days_left = Column(Integer)
    is_critical = Column(Boolean, default=False)
    pharmacy_route = Column(String, nullable=True) # For pharmacy routing

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    note = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class MedicationLog(Base):
    __tablename__ = "medication_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"))
    date = Column(String) # YYYY-MM-DD
    taken = Column(Boolean, default=False)

class FitnessLog(Base):
    __tablename__ = "fitness_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String) # YYYY-MM-DD
    steps = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0.0)
    water_glasses = Column(Integer, default=0)
    weight_kg = Column(Float, nullable=True)
    hrv_score = Column(Integer, nullable=True) # Heart Rate Variability

class WorkoutLog(Base):
    __tablename__ = "workout_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String)
    activity = Column(String)
    duration_minutes = Column(Integer)
    calories_burned = Column(Integer)

class MealLog(Base):
    __tablename__ = "meal_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String)
    meal_type = Column(String) # Breakfast, Lunch, Dinner
    calories = Column(Integer)
    protein = Column(Integer, default=0)
    carbs = Column(Integer, default=0)
    fats = Column(Integer, default=0)
    description = Column(String, nullable=True)

# --- 6. APPOINTMENTS & DOCTORS ---
class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    specialty = Column(String)
    consultation_fee = Column(Float)
    rating = Column(Float, default=5.0)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    doctor = Column(String) # Doctor's name
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    date = Column(String)
    time = Column(String)
    type = Column(String) # "Telehealth" or "In-Person"
    status = Column(String, default="Pending") # Scheduled, Pending, Cancelled
    fee = Column(Float, default=0.0)
    symptoms = Column(Text, nullable=True)
    triage_score = Column(Integer, default=0) # 0-10 severity

# --- 7. COMMERCE & KNOWLEDGE ---
class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float)
    status = Column(String, default="Processing") # Processing, Shipped, Delivered
    timestamp = Column(DateTime, default=datetime.utcnow)

class MedicalKnowledge(Base):
    __tablename__ = "medical_knowledge"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    content = Column(Text)
    source = Column(String)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    status = Column(String, default="Success")
    method = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

# --- 8. AMBULANCE BOOKING ---
class AmbulanceBooking(Base):
    __tablename__ = "ambulance_bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    patient_name = Column(String)
    pickup_address = Column(String)
    emergency_type = Column(String)  # Cardiac, Trauma, Respiratory, etc.
    status = Column(String, default="Dispatched")  # Dispatched, En Route, Arrived, Completed
    eta_minutes = Column(Integer, default=8)
    ambulance_id = Column(String)  # e.g. AMB-042
    driver_name = Column(String)
    driver_phone = Column(String)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)