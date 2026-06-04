import os
from dotenv import load_dotenv
import re
import base64
import json
from datetime import datetime
from sqlalchemy.orm import Session
from database import Product, CartItem, MedicalKnowledge, Prescription, MedicalRecord
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage

load_dotenv()

class GenAIMedicalAgent:
    def __init__(self, db: Session):
        self.db = db
        print("🧠 AGENT LOADED: Hybrid Logic Ready (Gemini Powered)") # DEBUG PRINT
        
        # LangChain expects GOOGLE_API_KEY, but we have GEMINI_API_KEY in .env
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=api_key
        )

    def process_message(self, patient_id: int, message: str, mode: str = "clinical"):
        print(f"📩 RECEIVED: {message}") # DEBUG PRINT
        clean_msg = message.lower()

        # --- 1. TRAP: PRESCRIPTIONS (The "Force" Logic) ---
        if "prescribe" in clean_msg:
            # Extract drug name (e.g. "Prescribe Metformin")
            match = re.search(r"prescribe\s+([a-zA-Z0-9\s\-\+]+)", clean_msg)
            
            if match:
                raw_name = match.group(1).strip()
                # Clean up text like "for diabetes"
                if " for " in raw_name: raw_name = raw_name.split(" for ")[0]
                
                # A. Find or Create Product (Auto-Stocking)
                product = self.db.query(Product).filter(Product.name.ilike(f"%{raw_name}%")).first()
                if not product:
                    print(f"⚠️ Drug '{raw_name}' missing. Auto-creating...")
                    product = Product(name=raw_name.title(), price=100.0, category="Prescription", stock=50, is_prescribed=True)
                    self.db.add(product)
                    self.db.commit()
                    self.db.refresh(product)

                # B. Add to Cart (Buying)
                self._add_to_cart(patient_id, product)
                
                # C. Add to Schedule (My Meds)
                existing = self.db.query(Prescription).filter_by(user_id=patient_id, drug_name=product.name).first()
                if not existing:
                    print(f"💊 Prescribing {product.name}...")
                    self.db.add(Prescription(
                        user_id=patient_id,
                        drug_name=product.name,
                        dosage="500mg", 
                        frequency="Twice Daily",
                        days_left=30,
                        is_critical=True
                    ))
                    self.db.commit()

                return {
                    "reply": f"✅ Prescribed {product.name}. Added to 'My Meds' and Cart.",
                    "action": "redirect_store"
                }

        # --- 2. TRAP: SCANS ---
        if "scan" in clean_msg or "x-ray" in clean_msg:
            test_name = "X-Ray" if "x-ray" in clean_msg else "Scan"
            self.db.add(MedicalRecord(
                user_id=patient_id, type="Imaging", title=f"Pending: {test_name}",
                doctor="Dr. Vani", date=datetime.now().strftime("%b %d, %Y"), file_type="PENDING"
            ))
            self.db.commit()
            return {
                "reply": f"✅ Scheduled {test_name}.",
                "action": "redirect_records"
            }

        # --- 3. FALLBACK: CHAT ---
        system_prompt = "You are Dr. UHLIS. Keep answers short and professional."
        chain = ChatPromptTemplate.from_messages([("system", system_prompt), ("user", "{message}")]) | self.llm | StrOutputParser()
        try:
            return {"reply": chain.invoke({"message": message}), "action": None}
        except:
            return {"reply": "AI Brain Offline.", "action": None}

    def _add_to_cart(self, user_id, product):
        item = self.db.query(CartItem).filter_by(user_id=user_id, product_id=product.id).first()
        if item: item.quantity += 1
        else: self.db.add(CartItem(user_id=user_id, product_id=product.id, quantity=1))
        self.db.commit()

    def analyze_image(self, image_bytes: bytes, organ: str, mime_type: str = "image/jpeg"):
        print(f"👁️ AGENT: Analyzing image for {organ} via Gemini Vision...")
        try:
            encoded_image = base64.b64encode(image_bytes).decode('utf-8')
            
            prompt = f"""
            You are a highly skilled AI Radiologist. Analyze this medical image of a {organ}.
            Provide a strictly formatted JSON response without any markdown wrappers (no ```json).
            It must contain exactly these keys:
            - "diagnosis": A short 3-word summary of the finding.
            - "confidence": A percentage string, e.g., "94.2%".
            - "severity": Either "Normal", "Mild", "Moderate", or "Severe".
            - "details": A 1-2 sentence detailed explanation of what is seen.
            """
            
            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{encoded_image}"
                        }
                    }
                ]
            )
            
            response = self.llm.invoke([message])
            text = response.content if hasattr(response, 'content') else str(response)
            
            # Clean up potential markdown formatting from Gemini
            text = text.replace("```json", "").replace("```", "").strip()
            
            # Parse JSON to ensure it's valid, then return it
            return json.loads(text)
            
        except Exception as e:
            print(f"❌ Gemini Vision Error: {e}")
            return {
                "diagnosis": "Analysis Failed",
                "confidence": "0.0%",
                "severity": "Unknown",
                "details": f"The AI could not analyze the image. Error: {str(e)}"
            }