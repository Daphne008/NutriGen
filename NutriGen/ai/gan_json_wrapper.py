import sys
import json
import os
import argparse
import warnings
import math

def safe_float(val, default):
    try:
        f = float(val)
        return default if math.isnan(f) else f
    except (ValueError, TypeError):
        return default

# Suppress warnings that might corrupt JSON output
warnings.filterwarnings('ignore')

from generate_custom_patient import initialize_system, generate_patient_data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, required=True)
    args = parser.parse_args()

    flags = {}
    cat = args.category.upper()
    if cat == "PEDIATRIC":
        flags["pediatric"] = True
    elif cat == "DIABETIC":
        flags["diabetic"] = True
    elif cat == "LOW_INCOME":
        flags["low_income"] = True
    elif cat == "OBESE":
        flags["obese"] = True
    elif cat == "ELDERLY":
        flags["geriatric"] = True
    elif cat == "ATHLETE":
        pass # No specific flag in generate_custom_patient, it will fall back to random
    
    try:
        # Redirect stdout to avoid print statements from initialize_system/generate_patient_data corrupting JSON
        original_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        
        system_state = initialize_system()
        selected_row = generate_patient_data(system_state, flags)

        sys.stdout = original_stdout

        if selected_row is None:
            print(json.dumps({"error": "Failed to generate patient matching criteria within limits."}))
            return

        # Map to GeneratedPatientReport structure
        age = safe_float(selected_row.get("RIDAGEYR"), 30)
        bmi = safe_float(selected_row.get("BMXBMI"), 25)
        calories = safe_float(selected_row.get("DR1TKCAL"), 2000)
        glucose = safe_float(selected_row.get("LBXGH"), 5.0) # HbA1c. We multiply by 20 to mock mg/dL for the frontend if needed, or maybe just 5.0 * 20 = 100
        
        prot_g = safe_float(selected_row.get("DR1TPROT"), 50)
        carb_g = safe_float(selected_row.get("DR1TCARB"), 200)
        fat_g = safe_float(selected_row.get("DR1TTFAT"), 70)
        
        total_macro_kcal = (prot_g * 4) + (carb_g * 4) + (fat_g * 9)
        if total_macro_kcal > 0:
            p_pct = (prot_g * 4) / total_macro_kcal * 100
            c_pct = (carb_g * 4) / total_macro_kcal * 100
            f_pct = (fat_g * 9) / total_macro_kcal * 100
        else:
            p_pct, c_pct, f_pct = 20, 50, 30

        report = {
            "age": round(age),
            "bmi": round(bmi, 1),
            "requiredCalories": round(calories),
            "healthRisks": ["GAN Generated Patient", f"Category: {cat}"],
            "bloodGlucose": round(glucose * 20),
            "macroTargets": {
                "proteinPercent": round(p_pct, 1),
                "carbsPercent": round(c_pct, 1),
                "fatPercent": round(f_pct, 1)
            }
        }
        
        print(json.dumps(report))
        
    except Exception as e:
        sys.stdout = original_stdout
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
