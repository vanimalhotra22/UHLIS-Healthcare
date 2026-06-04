import pandas as pd
import os
from sqlalchemy.orm import Session
from database import SessionLocal, init_db, Product, BioResource, User, MedicalKnowledge

def seed_all():
    print("🚀 Starting Smart Database Seeding...")
    init_db()
    db = SessionLocal()

    # --- 1. USERS & BIO-BANK (Keep existing) ---
    if not db.query(User).first():
        db.add_all([User(name="Dr. Vani", role="doctor"), User(name="Vani Malhotra", role="patient")])
    
    if not db.query(BioResource).first():
        db.add_all([
            BioResource(type="Blood", name="A+", location="City Hospital", quantity="12 units", status="Critical", contact="9876543210"),
            BioResource(type="Organ", name="Kidney (L)", location="AIIMS Registry", quantity="1 Match", status="High", contact="Registry")
        ])
    
    # --- 2. MEDICINES (The Fix) ---
    csv_path = os.path.join("data", "medicines.csv")
    if os.path.exists(csv_path) and not db.query(Product).first():
        print(f"💊 Reading {csv_path}...")
        try:
            df = pd.read_csv(csv_path, nrows=2000)
            
            # Smart Column Finder
            cols = [c.lower() for c in df.columns]
            name_col = next((c for c in df.columns if 'name' in c.lower() or 'drug' in c.lower()), None)
            price_col = next((c for c in df.columns if 'price' in c.lower() or 'mrp' in c.lower()), None)
            desc_col = next((c for c in df.columns if 'description' in c.lower() or 'composition' in c.lower()), None)

            if not name_col:
                print(f"❌ Error: Could not find a 'Name' column in CSV. Found: {df.columns}")
            else:
                products = []
                for _, row in df.iterrows():
                    # Name
                    p_name = str(row[name_col])
                    if len(p_name) > 2: # Ignore empty names
                        # Price
                        try: 
                            p_price = float(str(row[price_col]).replace('₹','').replace(',','').split(' ')[0]) if price_col else 50.0
                        except: p_price = 50.0
                        
                        # Description
                        p_desc = str(row[desc_col]) if desc_col else "Standard medical formulation."

                        products.append(Product(
                            name=p_name, 
                            price=p_price, 
                            category="General", 
                            description=p_desc[:100], 
                            stock=100, 
                            is_prescribed=False
                        ))
                
                db.add_all(products)
                db.commit()
                print(f"✅ Successfully added {len(products)} medicines!")

        except Exception as e:
            print(f"⚠️ CSV Error: {e}")

    db.commit()
    db.close()
    print("✨ Database Ready.")

if __name__ == "__main__":
    seed_all()