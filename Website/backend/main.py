from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import sys
import os
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import json

# Database Imports
import database
import models
import crud
import security


# Add parent directory to sys.path to import ML scripts
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir)) 
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from generate_custom_patient import initialize_system, generate_patient_data
    from generate_reports import analyze_patient
    import pandas as pd
except ImportError as e:
    print(f"Failed to import ML modules from {parent_dir}. Error: {e}")


ml_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing NutriGen Database Tables...")
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("PostgreSQL Tables verified!")
    except Exception as e:
        print(f"CRITICAL SQL ERROR: {e}")
        
    print("Initializing NutriGen ML System...")
    try:
        ml_state["system"] = initialize_system(base_dir=parent_dir)
        print("Model generated successfully!")
    except Exception as e:
        print(f"Warning: ML System failed to initialize. {e}")
        ml_state["system"] = None
    yield
    ml_state.clear()
    print("Shutting down NutriGen API...")


app = FastAPI(
    title="NutriGen API",
    description="Backend API with PostgreSQL Auth + GAN models.",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FoodSelection(BaseModel):
    food_id: str
    servings: float

class MealBlock(BaseModel):
    name: str # e.g. "Breakfast"
    foods: List[FoodSelection]

class DietPlan(BaseModel):
    blocks: List[MealBlock]
    patient_data: Dict[str, Any]

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/signup")
def signup(user: crud.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = crud.create_user(db=db, user=user)
    
    # Generate JWT
    access_token = security.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": new_user.name, "email": new_user.email}}


@app.post("/api/auth/login")
def login(creds: crud.UserLogin, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=creds.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not security.verify_password(creds.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = security.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": db_user.name, "email": db_user.email}}


# --- ML ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the NutriGen API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "ml_loaded": ml_state.get("system") is not None}

@app.get("/api/foods")
def get_foods(query: Optional[str] = None):
    try:
        with open(os.path.join(current_dir, "food_database.json"), "r") as f:
            food_db = json.load(f)
        
        if query:
            q = query.lower()
            results = [food for food in food_db if q in food["name"].lower() or q in food["category"].lower()]
        else:
            results = food_db
            
        return {"status": "success", "foods": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch foods: {str(e)}")

@app.get("/api/patient/generate")
def generate_patient(
    low_income: bool = False,
    severe_depression: bool = False,
    obese: bool = False,
    hypertension: bool = False,
    high_calorie: bool = False,
    pediatric: bool = False,
    geriatric: bool = False,
    underweight: bool = False,
    diabetic: bool = False,
    prediabetic: bool = False,
    high_cholesterol: bool = False,
    high_ldl: bool = False,
    albuminuria: bool = False,
    low_calorie: bool = False,
    high_sodium: bool = False,
    poor_diet: bool = False,
    food_insecure: bool = False,
    insomnia: bool = False,
    sedentary: bool = False
):
    if ml_state.get("system") is None:
        raise HTTPException(status_code=503, detail="ML System is not initialized or unavailable.")

    flags = {
        "low_income": low_income, "severe_depression": severe_depression,
        "obese": obese, "hypertension": hypertension, "high_calorie": high_calorie,
        "pediatric": pediatric, "geriatric": geriatric, "underweight": underweight,
        "diabetic": diabetic, "prediabetic": prediabetic, "high_cholesterol": high_cholesterol,
        "high_ldl": high_ldl, "albuminuria": albuminuria, "low_calorie": low_calorie,
        "high_sodium": high_sodium, "poor_diet": poor_diet, "food_insecure": food_insecure,
        "insomnia": insomnia, "sedentary": sedentary
    }

    try:
        row = generate_patient_data(ml_state["system"], flags)
        if row is None:
            raise HTTPException(status_code=404, detail="Could not generate a patient matching criteria.")
        patient_json = analyze_patient(row)
        raw_dict = row.to_dict()
        safe_raw_dict = {k: (None if pd.isna(v) else v) for k, v in raw_dict.items()}
        return {"status": "success", "patient_analysis": patient_json, "raw_base_data": safe_raw_dict}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate")
def evaluate_diet_plan(plan: DietPlan):
    try:
        with open(os.path.join(current_dir, "food_database.json"), "r") as f:
            food_db = json.load(f)
        food_dict = {item["id"]: item for item in food_db}
        
        total_cal = 0.0
        total_pro = 0.0
        total_car = 0.0
        total_fat = 0.0
        total_sug = 0.0
        total_fib = 0.0
        total_sod = 0.0
        
        food_ids_selected = set()
        
        for block in plan.blocks:
            for fs in block.foods:
                fid = fs.food_id
                srv = fs.servings
                if fid in food_dict:
                    fitem = food_dict[fid]
                    food_ids_selected.add(fid)
                    total_cal += fitem["calories"] * srv
                    total_pro += fitem["protein_g"] * srv
                    total_car += fitem["carbs_g"] * srv
                    total_fat += fitem["fat_g"] * srv
                    total_sug += fitem["sugars_g"] * srv
                    total_fib += fitem["fiber_g"] * srv
                    total_sod += fitem["sodium_mg"] * srv

        row_dict = plan.patient_data
        row_dict["DR1TKCAL"] = total_cal if total_cal > 0 else row_dict.get("DR1TKCAL", 0)
        row_dict["DR1TPROT"] = total_pro if total_pro > 0 else row_dict.get("DR1TPROT", 0)
        row_dict["DR1TCARB"] = total_car if total_car > 0 else row_dict.get("DR1TCARB", 0)
        row_dict["DR1TTFAT"] = total_fat if total_fat > 0 else row_dict.get("DR1TTFAT", 0)
        row_dict["DR1TSUGR"] = total_sug if total_sug > 0 else row_dict.get("DR1TSUGR", 0)
        row_dict["DR1TFIBE"] = total_fib if total_fib > 0 else row_dict.get("DR1TFIBE", 0)
        row_dict["DR1TSODI"] = total_sod if total_sod > 0 else row_dict.get("DR1TSODI", 0)
        
        row_series = pd.Series({k: (float('nan') if v is None else v) for k, v in row_dict.items()})
        analysis = analyze_patient(row_series)
        
        # Clinical Rule Engine
        clinical_warnings = []
        patient_warnings = analysis.get("warnings", [])
        
        bp_warnings = ["Hypertension (Stage 1)", "Hypertension (Stage 2)", "Elevated BP"]
        if any(w in patient_warnings for w in bp_warnings):
            high_sodium_chosen = any(food_dict[fid]["sodium_mg"] > 400 for fid in food_ids_selected if fid in food_dict)
            if high_sodium_chosen:
                clinical_warnings.append("Patient has Hypertension but plan includes high-sodium processed foods.")
        
        diabetic_warnings = ["Diabetic Range", "Prediabetic Range"]
        if any(w in patient_warnings for w in diabetic_warnings):
             high_sugar_chosen = any(food_dict[fid]["sugars_g"] > 20 for fid in food_ids_selected if fid in food_dict)
             if high_sugar_chosen:
                 clinical_warnings.append("Patient has elevated blood glucose but plan includes foods with concentrated simple sugars.")
                 
        fat_warnings = ["Hyperlipidemia", "High LDL", "High TC/HDL Ratio"]
        if any(w in patient_warnings for w in fat_warnings):
             high_fat_chosen = any(food_dict[fid]["fat_g"] > 15 for fid in food_ids_selected if fid in food_dict)
             if high_fat_chosen:
                 clinical_warnings.append("Patient has dyslipidemia but plan includes very high-fat foods.")
        
        if clinical_warnings:
             analysis["clinical_alerts"] = clinical_warnings
             
        return {"status": "success", "evaluation": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate: {str(e)}")
