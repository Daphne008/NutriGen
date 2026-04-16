import pandas as pd
import os

INPUT_CSV = "synthetic_patients_prototype.csv"
OUTPUT_DIR = "patient_reports"

def generate_report(row, index):
    # 1. Data Dictionary Mapping
    gender_map = {1.0: "Male", 2.0: "Female"}
    
    # Parse demographics and handle potential structural missingness (NaNs) gracefully
    age = row.get("RIDAGEYR", float('nan'))
    gender_code = row.get("RIAGENDR", float('nan'))
    gender = gender_map.get(gender_code, "Unknown/Missing")
    
    weight = row.get("BMXWT", float('nan'))
    height = row.get("BMXHT", float('nan'))
    bmi = row.get("BMXBMI", float('nan'))
    
    calories = row.get("DR1TKCAL", float('nan'))
    protein = row.get("DR1TPROT", float('nan'))
    carbs = row.get("DR1TCARB", float('nan'))
    fat = row.get("DR1TTFAT", float('nan'))
    sugars = row.get("DR1TSUGR", float('nan'))
    fiber = row.get("DR1TFIBE", float('nan'))
    sodium = row.get("DR1TSODI", float('nan'))
    
    bp_sys = row.get("BPXOSY1", float('nan'))
    bp_dia = row.get("BPXODI1", float('nan'))
    
    chol_tot = row.get("LBXTC", float('nan'))
    hdl = row.get("LBDHDD", float('nan'))
    ldl = row.get("LBDLDL", float('nan'))
    hba1c = row.get("LBXGH", float('nan'))
    
    # Comprehensive Modules
    dpq_cols = [f"DPQ0{i}0" for i in range(1, 10)]
    dpq_values = [row.get(c, float('nan')) for c in dpq_cols]
    
    # Calculate PHQ-9 only if we have at least some non-NaN responses; assume max value per question is 3
    if any(pd.notna(v) for v in dpq_values):
        phq9_score = sum(int(max(0, min(3, v))) for v in dpq_values if pd.notna(v))
    else:
        phq9_score = float('nan')
        
    sleep_hrs = row.get("SLD012", float('nan'))
    sedentary_min = row.get("PAD680", float('nan'))
    waist = row.get("BMXWAIST", float('nan'))
    
    food_sec_map = {1.0: "High/Full", 2.0: "Marginal", 3.0: "Low", 4.0: "Very Low"}
    food_security = food_sec_map.get(row.get("FSDAD", float('nan')), "Unknown/Missing")
    
    diet_qual_map = {1.0: "Excellent", 2.0: "Very Good", 3.0: "Good", 4.0: "Fair", 5.0: "Poor"}
    diet_quality = diet_qual_map.get(row.get("DBQ010", float('nan')), "Unknown/Missing")
    
    urine_alb = row.get("URXUMA", float('nan'))
    urine_creat = row.get("URXUCR", float('nan'))
    poverty_ratio = row.get("INDFMPIR", float('nan'))
    
    # Advanced Secondary Computations
    whtr = float('nan')
    if pd.notna(waist) and pd.notna(height) and height > 0:
        whtr = waist / height
        
    tc_hdl_ratio = float('nan')
    if pd.notna(chol_tot) and pd.notna(hdl) and hdl > 0:
        tc_hdl_ratio = chol_tot / hdl
        
    ldl_hdl_ratio = float('nan')
    if pd.notna(ldl) and pd.notna(hdl) and hdl > 0:
        ldl_hdl_ratio = ldl / hdl
        
    acr = float('nan')
    if pd.notna(urine_alb) and pd.notna(urine_creat) and urine_creat > 0:
        # Albumin mg/L, Creatinine mg/dL -> ratio (Albumin / Creatinine) * 100 for mg/g estimate
        acr = (urine_alb / urine_creat) * 100.0

    pct_carbs = float('nan')
    pct_protein = float('nan')
    pct_fat = float('nan')
    if pd.notna(calories) and calories > 0 and pd.notna(protein) and pd.notna(carbs) and pd.notna(fat):
        # Calories from macros
        kcal_protein = protein * 4
        kcal_carbs = carbs * 4
        kcal_fat = fat * 9
        total_macro_kcal = kcal_protein + kcal_carbs + kcal_fat
        if total_macro_kcal > 0:
            pct_protein = (kcal_protein / total_macro_kcal) * 100.0
            pct_carbs = (kcal_carbs / total_macro_kcal) * 100.0
            pct_fat = (kcal_fat / total_macro_kcal) * 100.0
    
    # 2. Clinical Analysis and Thresholds
    bmi_category = "Unknown"
    if pd.notna(bmi):
        if pd.notna(age) and age < 20:
            # Simplified pediatric BMI assessment
            # Real pediatric BMI uses age/sex percentiles; these are general thresholds
            if bmi < 14.0:
                bmi_category = "Underweight"
            elif 14.0 <= bmi < 24.0:
                bmi_category = "Normal Weight"
            elif 24.0 <= bmi < 28.0:
                bmi_category = "Overweight"
            else:
                bmi_category = "Obese"
        else:
            if bmi < 18.5:
                bmi_category = "Underweight"
            elif 18.5 <= bmi < 25:
                bmi_category = "Normal Weight"
            elif 25 <= bmi < 30:
                bmi_category = "Overweight"
            else:
                bmi_category = "Obese"
            
    calorie_warning = ""
    if pd.notna(calories):
        if calories > 2500:
            calorie_warning = "⚠️ **High Caloric Intake**"
        elif calories < 1200:
            calorie_warning = "⚠️ **Low Caloric Intake**"
            
    bp_warning = ""
    if pd.notna(bp_sys) and pd.notna(bp_dia):
        if bp_sys >= 140 or bp_dia >= 90:
            bp_warning = "⚠️ **Hypertension (Stage 2)**"
        elif bp_sys >= 130 or bp_dia >= 80:
            bp_warning = "⚠️ **Hypertension (Stage 1)**"
        elif bp_sys >= 120 and bp_dia < 80:
            bp_warning = "⚠️ **Elevated BP**"
            
    chol_warning = ""
    if pd.notna(chol_tot) and chol_tot >= 240:
        chol_warning = "⚠️ **Hyperlipidemia (High Total Chol)**"
    elif pd.notna(ldl) and ldl >= 160:
        chol_warning = "⚠️ **High LDL**"
        
    hba1c_warning = ""
    if pd.notna(hba1c):
        if hba1c >= 6.5:
            hba1c_warning = "⚠️ **Diabetic Range**"
        elif hba1c >= 5.7:
            hba1c_warning = "⚠️ **Prediabetic Range**"
            
    sodium_warning = ""
    if pd.notna(sodium) and sodium > 2300:
        sodium_warning = "⚠️ **High Sodium Intake**"
        
    phq9_category = "Unknown"
    if pd.notna(phq9_score):
        if phq9_score <= 4: phq9_category = "None-Minimal"
        elif phq9_score <= 9: phq9_category = "Mild Depression"
        elif phq9_score <= 14: phq9_category = "Moderate Depression"
        elif phq9_score <= 19: phq9_category = "Moderately Severe"
        else: phq9_category = "⚠️ **Severe Depression**"
        
    urine_warning = ""
    # Microalbuminuria threshold
    if pd.notna(urine_alb) and urine_alb > 30:
        urine_warning = "⚠️ **Elevated Albuminuria**"
    elif pd.notna(acr) and acr > 30:
        urine_warning = "⚠️ **High ACR (Proteinuria)**"
        
    poverty_warning = ""
    if pd.notna(poverty_ratio) and poverty_ratio < 1.0:
        poverty_warning = "⚠️ **Below Poverty Line**"
        
    whtr_warning = ""
    if pd.notna(whtr) and whtr > 0.5:
        whtr_warning = "⚠️ **High Cardiovascular Risk**"
        
    lipid_ratio_warning = ""
    if pd.notna(tc_hdl_ratio) and tc_hdl_ratio > 5.0:
        lipid_ratio_warning = "⚠️ **High TC/HDL Ratio**"
    elif pd.notna(ldl_hdl_ratio) and ldl_hdl_ratio > 3.5:
        lipid_ratio_warning = "⚠️ **Elevated LDL/HDL**"
        
    macro_warning = ""
    if pd.notna(calories) and pd.notna(pct_protein) and pd.notna(pct_carbs) and pd.notna(pct_fat):
        calculated_cals = (carbs*4) + (protein*4) + (fat*9)
        # Check if mathematically decoupled beyond 20% tolerance
        if abs(calories - calculated_cals) > (0.2 * calories):
             macro_warning = "⚠️ **Inconsistent Macro Recall**"
            
    # Format numeric strings to handle NaNs seamlessly during print
    age_str = f"{age:.0f}" if pd.notna(age) else "N/A"
    weight_str = f"{weight:.1f}" if pd.notna(weight) else "N/A"
    height_str = f"{height:.1f}" if pd.notna(height) else "N/A"
    bmi_str = f"{bmi:.1f}" if pd.notna(bmi) else "N/A"
    calories_str = f"{calories:.0f}" if pd.notna(calories) else "N/A"
    protein_str = f"{protein:.1f}" if pd.notna(protein) else "N/A"
    carbs_str = f"{carbs:.1f}" if pd.notna(carbs) else "N/A"
    fat_str = f"{fat:.1f}" if pd.notna(fat) else "N/A"
    sugars_str = f"{sugars:.1f}" if pd.notna(sugars) else "N/A"
    fiber_str = f"{fiber:.1f}" if pd.notna(fiber) else "N/A"
    sodium_str = f"{sodium:.0f}" if pd.notna(sodium) else "N/A"
    bp_sys_str = f"{bp_sys:.0f}" if pd.notna(bp_sys) else "N/A"
    bp_dia_str = f"{bp_dia:.0f}" if pd.notna(bp_dia) else "N/A"
    chol_tot_str = f"{chol_tot:.0f}" if pd.notna(chol_tot) else "N/A"
    hdl_str = f"{hdl:.0f}" if pd.notna(hdl) else "N/A"
    ldl_str = f"{ldl:.0f}" if pd.notna(ldl) else "N/A"
    hba1c_str = f"{hba1c:.1f}" if pd.notna(hba1c) else "N/A"
    phq9_str = f"{phq9_score:.0f}" if pd.notna(phq9_score) else "N/A"
    sleep_str = f"{sleep_hrs:.1f}" if pd.notna(sleep_hrs) else "N/A"
    sedentary_str = f"{sedentary_min:.0f}" if pd.notna(sedentary_min) else "N/A"
    waist_str = f"{waist:.1f}" if pd.notna(waist) else "N/A"
    alb_str = f"{urine_alb:.1f}" if pd.notna(urine_alb) else "N/A"
    creat_str = f"{urine_creat:.1f}" if pd.notna(urine_creat) else "N/A"
    poverty_str = f"{poverty_ratio:.2f}" if pd.notna(poverty_ratio) else "N/A"
    
    whtr_str = f"{whtr:.2f}" if pd.notna(whtr) else "N/A"
    tc_hdl_str = f"{tc_hdl_ratio:.2f}" if pd.notna(tc_hdl_ratio) else "N/A"
    ldl_hdl_str = f"{ldl_hdl_ratio:.2f}" if pd.notna(ldl_hdl_ratio) else "N/A"
    acr_str = f"{acr:.1f}" if pd.notna(acr) else "N/A"
    
    macro_profile = ""
    if pd.notna(pct_carbs) and pd.notna(pct_fat) and pd.notna(pct_protein):
        macro_profile = f"({pct_carbs:.0f}% C / {pct_fat:.0f}% F / {pct_protein:.0f}% P)"
    
    # 3. Markdown Template Injection
    md_content = f"""# Clinical Nutrition Intake: Patient #{index:03d}

## Demographic Profile
- **Age:** {age_str} years
- **Gender:** {gender}

## Anthropometric Measurements
- **Weight:** {weight_str} kg
- **Height:** {height_str} cm
- **Waist Circumference:** {waist_str} cm
- **Waist-to-Height Ratio:** {whtr_str} {whtr_warning}
- **BMI:** {bmi_str} ({bmi_category})

## Cardiovascular & Metabolic Health
- **Blood Pressure:** {bp_sys_str}/{bp_dia_str} mmHg {bp_warning}
- **Total Cholesterol:** {chol_tot_str} mg/dL {chol_warning}
  - HDL: {hdl_str} mg/dL
  - LDL: {ldl_str} mg/dL
  - TC/HDL Risk Ratio: {tc_hdl_str} {lipid_ratio_warning}
- **HbA1c:** {hba1c_str}% {hba1c_warning}
- **Urine Albumin:** {alb_str} mg/L 
- **Urine Creatinine:** {creat_str} mg/dL
- **Albumin-to-Creatinine Ratio (ACR):** {acr_str} mg/g {urine_warning}

## Dietary Recall (24-Hour) & Security
- **Self-Rated Diet Quality:** {diet_quality}
- **Food Security Status:** {food_security}
- **Total Calories:** {calories_str} kcal {calorie_warning} {macro_warning}
- **Macronutrient Breakdown:** {macro_profile}
- **Protein:** {protein_str} g
- **Carbohydrates:** {carbs_str} g
  - Total Sugars: {sugars_str} g
  - Dietary Fiber: {fiber_str} g
- **Total Fat:** {fat_str} g
- **Sodium:** {sodium_str} mg {sodium_warning}

## Lifestyle, Mental Health & Socioeconomic
- **Family Income-to-Poverty Ratio:** {poverty_str} {poverty_warning}
- **PHQ-9 Depression Score:** {phq9_str} ({phq9_category})
- **Sleep:** {sleep_str} hours/night
- **Sedentary Time:** {sedentary_str} minutes/day

---
*Synthetic clinical record generated by NutriGen GAN Prototype.*
"""
    return md_content

def main():
    if not os.path.exists(INPUT_CSV):
        print(f"Error: Could not find {INPUT_CSV}. Ensure the GAN has generated data.")
        return
        
    df = pd.read_csv(INPUT_CSV)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Export the first 25 patients to avoid cluttering the hard drive with hundreds of .md files
    limit = min(25, len(df))
    print(f"Translating {limit} synthetic patients into Natural Language Clinical Sheets...")
    
    for i in range(limit):
        row = df.iloc[i]
        report_content = generate_report(row, i+1)
        
        filename = os.path.join(OUTPUT_DIR, f"patient_{i+1:03d}_report.md")
        with open(filename, "w") as f:
            f.write(report_content)
            
    print(f"Successfully generated {limit} Markdown reports in the '{OUTPUT_DIR}' directory.")

if __name__ == "__main__":
    main()
