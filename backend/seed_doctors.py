from database import SessionLocal, User, DoctorProfile

db = SessionLocal()

# Check if doctors exist
doctors = db.query(User).filter(User.role == "doctor").all()
if not doctors:
    doc1 = User(name="Dr. Sarah Chen", role="doctor")
    doc2 = User(name="Dr. Michael Torres", role="doctor")
    doc3 = User(name="Dr. Vani", role="doctor")
    db.add_all([doc1, doc2, doc3])
    db.commit()
    doctors = [doc1, doc2, doc3]

for doc in doctors:
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == doc.id).first()
    if not profile:
        specialty = "Cardiology"
        fee = 150.0
        if "Torres" in doc.name:
            specialty = "Neurology"
            fee = 200.0
        elif "Vani" in doc.name:
            specialty = "General Practice"
            fee = 100.0
            
        p = DoctorProfile(user_id=doc.id, specialty=specialty, consultation_fee=fee, rating=4.9)
        db.add(p)

db.commit()
db.close()
