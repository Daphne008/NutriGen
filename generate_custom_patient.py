import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import QuantileTransformer
import os
import sys

# 1. Configuration and Hyperparameters
DATA_PATH = "NutriGen_Patients_Cleaned.csv"
OUTPUT_PATH = "synthetic_patients_prototype.csv"

# Focusing on key demographic and nutritional features for the prototype
FEATURES = [
    "RIDAGEYR", # Age
    "RIAGENDR", # Gender
    "BMXWT",    # Weight (kg)
    "BMXHT",    # Height (cm)
    "BMXBMI",   # BMI
    "DR1TKCAL", # Calories
    "DR1TPROT", # Protein (g)
    "DR1TCARB", # Carbohydrates (g)
    "DR1TTFAT", # Total Fat (g)
    "BPXOSY1",  # Systolic BP
    "BPXODI1",  # Diastolic BP
    "LBXTC",    # Total Cholesterol (mg/dL)
    "LBDHDD",   # HDL Cholesterol (mg/dL)
    "LBDLDL",   # LDL Cholesterol (mg/dL)
    "LBXGH",    # Glycohemoglobin / HbA1c (%)
    "DR1TSUGR", # Total Sugars (g)
    "DR1TFIBE", # Dietary Fiber (g)
    "DR1TSODI", # Sodium (mg)
    "DPQ010",   # PHQ-9: Have little interest in doing things
    "DPQ020",   # PHQ-9: Feeling down, depressed, or hopeless
    "DPQ030",   # PHQ-9: Trouble sleeping or sleeping too much
    "DPQ040",   # PHQ-9: Feeling tired or having little energy
    "DPQ050",   # PHQ-9: Poor appetite or overeating
    "DPQ060",   # PHQ-9: Feeling bad about yourself
    "DPQ070",   # PHQ-9: Trouble concentrating on things
    "DPQ080",   # PHQ-9: Moving or speaking slowly or too fast
    "DPQ090",   # PHQ-9: Thought you would be better off dead
    "SLD012",   # Sleep hours
    "PAD680",   # Sedentary minutes a day
    "FSDAD",    # Adult food security category
    "DBQ010",   # Self-rated diet quality
    "URXUMA",   # Urine albumin (mg/L)
    "URXUCR",   # Urine creatinine (mg/dL)
    "BMXWAIST", # Waist Circumference (cm)
    "INDFMPIR"  # Family Income to Poverty Ratio
]

EPOCHS = 200
BATCH_SIZE = 128
LR = 0.0002
LATENT_DIM = 128

def main():
    # 2. Data Loading and Preprocessing
    print("Loading data...")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Ensure {DATA_PATH} is in the current directory.")
        
    df = pd.read_csv(DATA_PATH)
    
    # Drop identifier columns that hold no predictive power to prevent noise mapping
    if 'SEQN' in df.columns:
        df = df.drop(columns=['SEQN'])
        
    FEATURES = list(df.columns)
    print(f"Data shape initially: {df.shape} with {len(FEATURES)} features.")

    # Dynamic Feature Separation
    # We classify features as categorical if they are non-numeric or have very few unique integer/float values (cardinality < 10)
    # This is a common heuristic for clinical/survey tabular datasets like NHANES
    cat_cols = []
    cont_cols = []
    
    for col in FEATURES:
        if not pd.api.types.is_numeric_dtype(df[col]):
            cat_cols.append(col)
        elif df[col].nunique() < 10:
            cat_cols.append(col)
        else:
            cont_cols.append(col)
            
    print(f"Identified {len(cont_cols)} Continuous Features and {len(cat_cols)} Categorical Features.")

    # Pre-processing: Missingness Indicators
    print("Pre-processing data with Missingness Indicators...")
    cols_with_missing_cont = [col for col in cont_cols if df[col].isna().any()]
    indicator_cols_cont = [f"{col}_is_missing" for col in cols_with_missing_cont]
    
    # Avoid pandas fragmentation by building a dict of new columns first
    new_indicator_cols = {}
    for col in cols_with_missing_cont:
        new_indicator_cols[f"{col}_is_missing"] = df[col].isna().astype(float)
    
    if new_indicator_cols:
        indicators_df = pd.DataFrame(new_indicator_cols, index=df.index)
        df = pd.concat([df, indicators_df], axis=1)
        
    # Fill missing continuous values with the column MEAN
    if len(cont_cols) > 0:
        df[cont_cols] = df.fillna(df.mean(numeric_only=True))[cont_cols]

    # Dynamically One-Hot Encode ALL Categorical Variables
    # We will build a list of dummy DataFrames and a mapping of how many dimensions each category takes
    # so we can decode them linearly later
    dummy_dfs = []
    cat_dimensions = []
    cat_columns_ordered = []
    
    for cat_col in cat_cols:
        # Treat NaN as a discrete category so the GAN learns structural missingness (MNAR)
        df[cat_col] = df[cat_col].fillna("Missing")
            
        dummies = pd.get_dummies(df[cat_col], prefix=cat_col).astype(float)
        dummy_dfs.append(dummies)
        cat_dimensions.append(dummies.shape[1])
        cat_columns_ordered.append(cat_col)
        
    if dummy_dfs:
        all_dummies_df = pd.concat(dummy_dfs, axis=1)
    else:
        all_dummies_df = pd.DataFrame()
        
    # Calculate strict biological bounds for all continuous variables before normalization
    cont_bounds = {}
    if len(cont_cols) > 0:
        for col in cont_cols:
            cont_bounds[col] = {'min': df[col].min(), 'max': df[col].max()}

    # Scale ONLY the continuous features using QuantileTransformer for skewed biological data
    scaler = QuantileTransformer(output_distribution='normal', random_state=42)
    if len(cont_cols) > 0:
        scaled_cont = scaler.fit_transform(df[cont_cols])
        cont_df = pd.DataFrame(scaled_cont, columns=cont_cols)
    else:
        cont_df = pd.DataFrame()
    
    # Recombine: Continuous + Indicators + Categorical One-Hot
    dfs_to_concat = []
    if not cont_df.empty: dfs_to_concat.append(cont_df)
    if indicator_cols_cont:
        indicators_df = df[indicator_cols_cont].reset_index(drop=True)
        dfs_to_concat.append(indicators_df)
    if not all_dummies_df.empty:
        dfs_to_concat.append(all_dummies_df.reset_index(drop=True))
    
    final_df = pd.concat(dfs_to_concat, axis=1)
    
    tensor_data = torch.FloatTensor(final_df.values)
    data_loader = torch.utils.data.DataLoader(tensor_data, batch_size=BATCH_SIZE, shuffle=True)

    # 3. Model Definitions
    input_dim = final_df.shape[1]
    
    # We need to know sizes to split output in Generator
    num_cont_and_ind = len(cont_cols) + len(indicator_cols_cont)
    num_cat = all_dummies_df.shape[1] if not all_dummies_df.empty else 0

    class Generator(nn.Module):
        def __init__(self, latent_dim, cont_dim, cat_dim):
            super(Generator, self).__init__()
            self.cont_dim = cont_dim
            self.cat_dim = cat_dim
            
            self.shared = nn.Sequential(
                nn.Linear(latent_dim, 512),
                nn.BatchNorm1d(512),
                nn.ReLU(),
                nn.Linear(512, 1024),
                nn.BatchNorm1d(1024),
                nn.ReLU()
            )
            
            if cont_dim > 0:
                self.cont_layer = nn.Linear(1024, cont_dim)
            if cat_dim > 0:
                self.cat_layer = nn.Linear(1024, cat_dim)

        def forward(self, z):
            x = self.shared(z)
            
            outputs = []
            if self.cont_dim > 0:
                outputs.append(self.cont_layer(x))
            
            if self.cat_dim > 0:
                # We have multiple categories now, each needs its own softmax
                # To be precise, we should split the cat_layer output and softmax each category.
                # For WGAN-GP stability across 100+ columns, we'll apply a grouped Gumbel Softmax.
                cat_logits = self.cat_layer(x)
                
                # Split logits based on actual category dimensions
                split_logits = torch.split(cat_logits, cat_dimensions, dim=1)
                cat_outs = []
                for logits in split_logits:
                    cat_outs.append(nn.functional.gumbel_softmax(logits, tau=0.7, hard=True))
                    
                outputs.append(torch.cat(cat_outs, dim=1))
                
            return torch.cat(outputs, dim=1)


    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Argument Parser
    import argparse
    parser = argparse.ArgumentParser(description="Generate targeted synthetic patient.")
    parser.add_argument("--low-income", action="store_true", help="Generate a patient below the poverty line")
    parser.add_argument("--severe-depression", action="store_true", help="Generate a patient with severe depression (PHQ-9 >= 15)")
    parser.add_argument("--obese", action="store_true", help="Generate an obese patient (BMI >= 30)")
    parser.add_argument("--hypertension", action="store_true", help="Generate a patient with Stage 2 Hypertension")
    parser.add_argument("--high-calorie", action="store_true", help="Generate a patient with caloric intake > 2500 kcal")
    parser.add_argument("--pediatric", action="store_true", help="Generate a pediatric patient (Age < 18)")
    parser.add_argument("--geriatric", action="store_true", help="Generate a geriatric patient (Age >= 65)")
    parser.add_argument("--underweight", action="store_true", help="Generate an underweight patient (BMI < 18.5)")
    parser.add_argument("--diabetic", action="store_true", help="Generate a diabetic patient (HbA1c >= 6.5%)")
    parser.add_argument("--prediabetic", action="store_true", help="Generate a prediabetic patient (HbA1c 5.7% - 6.4%)")
    parser.add_argument("--high-cholesterol", action="store_true", help="Generate a patient with High Total Cholesterol (>= 240 mg/dL)")
    parser.add_argument("--high-ldl", action="store_true", help="Generate a patient with High LDL (>= 160 mg/dL)")
    parser.add_argument("--albuminuria", action="store_true", help="Generate a patient with Elevated Albuminuria (> 30 mg/L)")
    parser.add_argument("--low-calorie", action="store_true", help="Generate a patient with low caloric intake (< 1200 kcal)")
    parser.add_argument("--high-sodium", action="store_true", help="Generate a patient with high sodium intake (> 2300 mg)")
    parser.add_argument("--poor-diet", action="store_true", help="Generate a patient with a self-reported Poor or Fair diet")
    parser.add_argument("--food-insecure", action="store_true", help="Generate a patient who is food insecure")
    parser.add_argument("--insomnia", action="store_true", help="Generate a patient with insomnia (< 5 hours sleep)")
    parser.add_argument("--sedentary", action="store_true", help="Generate a highly sedentary patient (> 480 mins/day)")
    args = parser.parse_args()
    
    # If no flags are provided, it will simply match the first generated patient
    if not any(vars(args).values()):
        print("No specific clinical flags requested. Generating a random synthetic patient...")
        
    MODEL_PATH = "nutrigen_gan_v6.pth"
    generator = Generator(LATENT_DIM, num_cont_and_ind, num_cat).to(device)

    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file {MODEL_PATH} not found.")
        return
        
    print(f"Loading inference model from {MODEL_PATH}...")
    generator.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=True))
    generator.eval()
    
    print("Searching for a patient matching the requested criteria...")
    
    BATCH_SIZE_INFERENCE = 2000
    attempts = 0
    match_found = False
    
    while not match_found:
        attempts += 1
        z = torch.randn(BATCH_SIZE_INFERENCE, LATENT_DIM, device=device)
        with torch.no_grad():
            generated_scaled_all = generator(z).cpu().numpy()
            
        generated_df = pd.DataFrame(index=range(BATCH_SIZE_INFERENCE))
        
        # Continuous
        if len(cont_cols) > 0:
            gen_cont_scaled = generated_scaled_all[:, :len(cont_cols)]
            generated_cont = scaler.inverse_transform(gen_cont_scaled)
            cont_reconstructed_df = pd.DataFrame(generated_cont, columns=cont_cols)
            generated_df = pd.concat([generated_df, cont_reconstructed_df], axis=1)

            if indicator_cols_cont:
                start_idx = len(cont_cols)
                end_idx = start_idx + len(indicator_cols_cont)
                gen_indicators_raw = generated_scaled_all[:, start_idx:end_idx]
                gen_indicators = (gen_indicators_raw > 1.0).astype(float)
                for idx, col in enumerate(cols_with_missing_cont):
                    is_missing_mask = gen_indicators[:, idx] == 1.0
                    generated_df.loc[is_missing_mask, col] = np.nan

        # Categorical
        if num_cat > 0:
            cat_start_idx = num_cont_and_ind
            gen_cat_raw = generated_scaled_all[:, cat_start_idx:]
            current_idx = 0
            new_cat_cols = {}
            for i, col in enumerate(cat_columns_ordered):
                dim = cat_dimensions[i]
                col_logits = gen_cat_raw[:, current_idx:current_idx+dim]
                dummy_cols = all_dummies_df.columns[current_idx:current_idx+dim]
                cat_classes = dummy_cols.str.replace(f"{col}_", "", regex=False).values
                predicted = np.argmax(col_logits, axis=1)
                col_data = pd.Series(cat_classes[predicted])
                col_data = col_data.replace("Missing", np.nan)
                
                # Restore biological categories gracefully back to float
                try:
                    new_cat_cols[col] = pd.to_numeric(col_data)
                except (ValueError, TypeError):
                    new_cat_cols[col] = col_data
                current_idx += dim
                
            cat_reconstructed_df = pd.DataFrame(new_cat_cols)
            generated_df = pd.concat([generated_df, cat_reconstructed_df], axis=1)

        generated_df = generated_df[[c for c in FEATURES if c in generated_df.columns]]

        # Bounds
        if len(cont_cols) > 0:
            for col in cont_cols:
                min_bound = cont_bounds[col]['min']
                max_bound = cont_bounds[col]['max']
                generated_df[col] = generated_df[col].clip(lower=min_bound, upper=max_bound)
                
        # Niche absolute constraints explicitly mapped from NHANES documentation
        if "RIDAGEYR" in generated_df.columns:
            # NHANES top-codes age at 80 for privacy
            generated_df["RIDAGEYR"] = generated_df["RIDAGEYR"].clip(upper=80.0)
                
        # --- ALGORITHM ACCURACY FIXES ---
        # Biological Realism Filters (Rejection Sampling Logic replacing static clips)
        # Note: Caloric and Structural Missingness bounds remain as deterministic clips
        # because they simulate NHANES data collection methodology, not biological physiology.
        if "RIDAGEYR" in generated_df.columns:
            # Caloric Capping (Prevent hallucinatory caloric bloat)
            infants_mask = generated_df["RIDAGEYR"] < 2
            if "DR1TKCAL" in generated_df.columns:
                generated_df.loc[infants_mask, "DR1TKCAL"] = generated_df.loc[infants_mask, "DR1TKCAL"].clip(upper=1500.0)
            if "DR1TSODI" in generated_df.columns:
                generated_df.loc[infants_mask, "DR1TSODI"] = generated_df.loc[infants_mask, "DR1TSODI"].clip(upper=1500.0)

            toddler_mask = (generated_df["RIDAGEYR"] >= 2) & (generated_df["RIDAGEYR"] < 6)
            if "DR1TKCAL" in generated_df.columns:
                generated_df.loc[toddler_mask, "DR1TKCAL"] = generated_df.loc[toddler_mask, "DR1TKCAL"].clip(upper=2500.0)
            if "DR1TSODI" in generated_df.columns:
                generated_df.loc[toddler_mask, "DR1TSODI"] = generated_df.loc[toddler_mask, "DR1TSODI"].clip(upper=2500.0)
                
            kids_mask = (generated_df["RIDAGEYR"] >= 6) & (generated_df["RIDAGEYR"] < 10)
            if "DR1TKCAL" in generated_df.columns:
                generated_df.loc[kids_mask, "DR1TKCAL"] = generated_df.loc[kids_mask, "DR1TKCAL"].clip(upper=3500.0)
            if "DR1TSODI" in generated_df.columns:
                generated_df.loc[kids_mask, "DR1TSODI"] = generated_df.loc[kids_mask, "DR1TSODI"].clip(upper=3500.0)
                
            # Adult floors (We only use Rejection Sampling for critical pediatric bounds)
                
            # Caloric Survival Minimums (>= 10 years)
            survival_mask = generated_df["RIDAGEYR"] >= 10
            if "DR1TKCAL" in generated_df.columns:
                generated_df.loc[survival_mask, "DR1TKCAL"] = generated_df.loc[survival_mask, "DR1TKCAL"].clip(lower=500.0)

        # Pediatric Structural Missingness
        if "RIDAGEYR" in generated_df.columns:
            age_lt_8 = generated_df["RIDAGEYR"] < 8
            age_lt_16 = generated_df["RIDAGEYR"] < 16
            
            # Blood Pressure is incredibly rare below age 8
            if "BPXOSY1" in generated_df.columns:
                generated_df.loc[age_lt_8, "BPXOSY1"] = np.nan
            if "BPXODI1" in generated_df.columns:
                generated_df.loc[age_lt_8, "BPXODI1"] = np.nan
                
            # Sleep and Psychological Surveys are not given to young children
            if "SLD012" in generated_df.columns:
                generated_df.loc[age_lt_16, "SLD012"] = np.nan
            if "DBQ010" in generated_df.columns:
                generated_df.loc[age_lt_16, "DBQ010"] = np.nan
                
            dpq_cols = [f"DPQ0{i}0" for i in range(1, 10)]
            for c in dpq_cols:
                if c in generated_df.columns:
                    generated_df.loc[age_lt_16, c] = np.nan

        # 2. Absolute Logic Gates & Extreme Boundaries
        # Moved to Rejection Sampling array during inference validation

        # 3. Deterministic Recalculation
        # BMI must be explicitly Weight(kg) / (Height(m)^2)
        if all(col in generated_df.columns for col in ["BMXWT", "BMXHT", "BMXBMI"]):
            # Height is in cm, so divide by 100 for meters
            calc_bmi = generated_df["BMXWT"] / ((generated_df["BMXHT"] / 100.0) ** 2)
            
            # Only overwrite if we don't have NaNs in the source columns
            valid_mask = generated_df["BMXWT"].notna() & generated_df["BMXHT"].notna()
            generated_df.loc[valid_mask, "BMXBMI"] = calc_bmi[valid_mask]
        # --------------------------------
                
        # Scan for condition
        for i in range(BATCH_SIZE_INFERENCE):
            row = generated_df.iloc[i]
            match = True
            
            if args.low_income:
                if pd.isna(row.get("INDFMPIR")) or row["INDFMPIR"] >= 1.0:
                    match = False
            if args.severe_depression:
                dpq_cols = [f"DPQ0{x}0" for x in range(1, 10)]
                dpq_vals = [row.get(c, float('nan')) for c in dpq_cols]
                score = sum(int(max(0, min(3, v))) for v in dpq_vals if pd.notna(v))
                if score < 15:
                    match = False
            if args.obese:
                if pd.isna(row.get("BMXBMI")) or row["BMXBMI"] < 30.0:
                    match = False
            if args.hypertension:
                sys_bp = row.get("BPXOSY1", np.nan)
                dia_bp = row.get("BPXODI1", np.nan)
                if pd.isna(sys_bp) or pd.isna(dia_bp) or (sys_bp < 140 and dia_bp < 90):
                    match = False
            if args.high_calorie:
                if pd.isna(row.get("DR1TKCAL")) or row["DR1TKCAL"] <= 2500:
                    match = False
            if args.pediatric:
                if pd.isna(row.get("RIDAGEYR")) or row["RIDAGEYR"] >= 18: match = False
            if args.geriatric:
                if pd.isna(row.get("RIDAGEYR")) or row["RIDAGEYR"] < 65: match = False
            if args.underweight:
                if pd.isna(row.get("BMXBMI")) or row["BMXBMI"] >= 18.5: match = False
            if args.diabetic:
                if pd.isna(row.get("LBXGH")) or row["LBXGH"] < 6.5: match = False
            if args.prediabetic:
                if pd.isna(row.get("LBXGH")) or row["LBXGH"] < 5.7 or row["LBXGH"] >= 6.5: match = False
            if args.high_cholesterol:
                if pd.isna(row.get("LBXTC")) or row["LBXTC"] < 240: match = False
            if args.high_ldl:
                if pd.isna(row.get("LBDLDL")) or row["LBDLDL"] < 160: match = False
            if args.albuminuria:
                if pd.isna(row.get("URXUMA")) or row["URXUMA"] <= 30: match = False
            if args.low_calorie:
                if pd.isna(row.get("DR1TKCAL")) or row["DR1TKCAL"] >= 1200: match = False
            if args.high_sodium:
                if pd.isna(row.get("DR1TSODI")) or row["DR1TSODI"] <= 2300: match = False
            if args.poor_diet:
                if pd.isna(row.get("DBQ010")) or row["DBQ010"] not in [4.0, 5.0]: match = False
            if args.food_insecure:
                if pd.isna(row.get("FSDAD")) or row["FSDAD"] not in [2.0, 3.0, 4.0]: match = False
            if args.insomnia:
                if pd.isna(row.get("SLD012")) or row["SLD012"] >= 5.0: match = False
            if args.sedentary:
                if pd.isna(row.get("PAD680")) or row["PAD680"] <= 480: match = False
                    
            # Rejection Sampling for Pediatric Physics
            # Reject the patient row if their generated height/weight violates CDC growth bounds
            _age = row.get("RIDAGEYR", np.nan)
            _ht = row.get("BMXHT", np.nan)
            _wt = row.get("BMXWT", np.nan)
            if pd.notna(_age):
                if _age < 2:
                    if pd.notna(_ht) and not (45.0 <= _ht <= 90.0): match = False
                    if pd.notna(_wt) and not (2.5 <= _wt <= 15.0): match = False
                elif 2 <= _age < 6:
                    if pd.notna(_ht) and not (80.0 <= _ht <= 115.0): match = False
                    if pd.notna(_wt) and not (10.0 <= _wt <= 24.0): match = False
                elif 6 <= _age < 10:
                    if pd.notna(_ht) and not (105.0 <= _ht <= 140.0): match = False
                    if pd.notna(_wt) and not (16.0 <= _wt <= 40.0): match = False
                elif 10 <= _age < 14:
                    if pd.notna(_ht) and not (130.0 <= _ht <= 165.0): match = False
                    if pd.notna(_wt) and not (26.0 <= _wt <= 65.0): match = False
                elif 14 <= _age < 18:
                    if pd.notna(_ht) and not (150.0 <= _ht <= 185.0): match = False
                    if pd.notna(_wt) and not (40.0 <= _wt <= 85.0): match = False

            # Comprehensive Rejection Sampling for Absolute Biological & Physics Logic
            
            # Sleep Reality Checks
            _sleep = row.get("SLD012", np.nan)
            if pd.notna(_sleep) and not (2.0 <= _sleep <= 18.0): match = False
                
            # Absolute Blood Pressure bounds & Mechanics
            _sys = row.get("BPXOSY1", np.nan)
            _dia = row.get("BPXODI1", np.nan)
            if pd.notna(_sys) and not (70.0 <= _sys <= 230.0): match = False
            if pd.notna(_dia) and not (40.0 <= _dia <= 140.0): match = False
            if pd.notna(_sys) and pd.notna(_dia) and (_sys < _dia + 10.0): match = False
                
            # Blood Sugar Limits
            _hba1c = row.get("LBXGH", np.nan)
            if pd.notna(_hba1c) and not (3.5 <= _hba1c <= 18.0): match = False
                
            # Carbohydrate Physics (Carbs >= Sugars + Fiber)
            _carbs = row.get("DR1TCARB", np.nan)
            _sugars = row.get("DR1TSUGR", np.nan)
            _fiber = row.get("DR1TFIBE", np.nan)
            if pd.notna(_carbs) and pd.notna(_sugars) and pd.notna(_fiber):
                if _carbs < _sugars + _fiber: match = False
                
            # Lipid Fractions (Total Chol >= HDL + LDL)
            _tc = row.get("LBXTC", np.nan)
            _hdl = row.get("LBDHDD", np.nan)
            _ldl = row.get("LBDLDL", np.nan)
            if pd.notna(_tc) and pd.notna(_hdl) and pd.notna(_ldl):
                if _tc < _hdl + _ldl: match = False
                
            # Time Continuity (Sleep + Sedentary <= 1440 mins)
            _sedentary = row.get("PAD680", np.nan)
            if pd.notna(_sleep) and pd.notna(_sedentary):
                if (_sleep * 60.0) + _sedentary > 1440.0: match = False
                
            # Waist-Height Limit & Floors
            _waist = row.get("BMXWAIST", np.nan)
            if pd.notna(_waist) and pd.notna(_ht) and (_waist >= _ht): match = False
            if pd.notna(_age) and _age >= 18 and pd.notna(_waist) and _waist < 50.0: match = False
                
            # Caloric Mathematics (Total Kcal >= Protein*4 + Carbs*4 + Fat*9)
            _kcal = row.get("DR1TKCAL", np.nan)
            _prot = row.get("DR1TPROT", np.nan)
            _fat = row.get("DR1TTFAT", np.nan)
            if pd.notna(_kcal) and pd.notna(_prot) and pd.notna(_carbs) and pd.notna(_fat):
                macro_kcal = (_prot * 4.0) + (_carbs * 4.0) + (_fat * 9.0)
                if _kcal < macro_kcal: match = False
                
            # Poverty Ratio Boundaries (NHANES Top-coded at 5.0)
            _pov = row.get("INDFMPIR", np.nan)
            if pd.notna(_pov) and not (0.0 <= _pov <= 5.0): match = False
            
            # Urine Creatinine Floor (Prevention of Division by Zero for ACR)
            _ucr = row.get("URXUCR", np.nan)
            if pd.notna(_ucr) and _ucr < 10.0: match = False

            if match:
                selected_row = row
                match_found = True
                break
                
        if attempts % 10 == 0:
            print(f"Scanned {attempts * BATCH_SIZE_INFERENCE} patients so far... continuing to search.")
            
    print(f"\nMatch Found! Extracted target patient after evaluating {attempts * BATCH_SIZE_INFERENCE} profiles.")
    
    # Generate the Markdown report using existing logic
    from generate_reports import generate_report
    
    OUTPUT_DIR = "patient_reports"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    # create descriptive filename based on flags
    flags = []
    if args.low_income: flags.append("lowincome")
    if args.severe_depression: flags.append("depressed")
    if args.obese: flags.append("obese")
    if args.hypertension: flags.append("hypertension")
    if args.high_calorie: flags.append("highcal")
    if args.pediatric: flags.append("pediatric")
    if args.geriatric: flags.append("geriatric")
    if args.underweight: flags.append("underweight")
    if args.diabetic: flags.append("diabetic")
    if args.prediabetic: flags.append("prediabetic")
    if args.high_cholesterol: flags.append("highchol")
    if args.high_ldl: flags.append("highldl")
    if args.albuminuria: flags.append("albuminuria")
    if args.low_calorie: flags.append("lowcal")
    if args.high_sodium: flags.append("highsodium")
    if args.poor_diet: flags.append("poordiet")
    if args.food_insecure: flags.append("foodinsecure")
    if args.insomnia: flags.append("insomnia")
    if args.sedentary: flags.append("sedentary")
    
    flag_str = "_".join(flags) if flags else "random"
    out_file = os.path.join(OUTPUT_DIR, f"targeted_patient_{flag_str}.md")
    
    report_md = generate_report(selected_row, index=999)
    with open(out_file, "w") as f:
        f.write(report_md)
        
    print(f"Successfully generated custom Markdown report in: {out_file}")

if __name__ == "__main__":
    main()
