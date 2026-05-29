import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from sklearn.preprocessing import QuantileTransformer
import os
import argparse

DATA_PATH = "NutriGen_Patients_Cleaned.csv"
MODEL_PATH = "nutrigen_gan_v6.pth"
FEATURES = [
    "RIDAGEYR", "RIAGENDR", "BMXWT", "BMXHT", "BMXBMI", "DR1TKCAL", 
    "DR1TPROT", "DR1TCARB", "DR1TTFAT", "BPXOSY1", "BPXODI1", "LBXTC", 
    "LBDHDD", "LBDLDL", "LBXGH", "DR1TSUGR", "DR1TFIBE", "DR1TSODI", 
    "DPQ010", "DPQ020", "DPQ030", "DPQ040", "DPQ050", "DPQ060", 
    "DPQ070", "DPQ080", "DPQ090", "SLD012", "PAD680", "FSDAD", 
    "DBQ010", "URXUMA", "URXUCR", "BMXWAIST", "INDFMPIR"
]

LATENT_DIM = 128
BATCH_SIZE_INFERENCE = 2000

class Generator(nn.Module):
    def __init__(self, latent_dim, cont_dim, cat_dim, cat_dimensions):
        super(Generator, self).__init__()
        self.cont_dim = cont_dim
        self.cat_dim = cat_dim
        self.cat_dimensions = cat_dimensions
        
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
            cat_logits = self.cat_layer(x)
            split_logits = torch.split(cat_logits, self.cat_dimensions, dim=1)
            cat_outs = []
            for logits in split_logits:
                cat_outs.append(nn.functional.gumbel_softmax(logits, tau=0.7, hard=True))
            outputs.append(torch.cat(cat_outs, dim=1))
        return torch.cat(outputs, dim=1)


def initialize_system(base_dir="."):
    """Loads the dataset, fits the scaler, and instantiates the Generator."""
    data_path = os.path.join(base_dir, DATA_PATH)
    model_path = os.path.join(base_dir, MODEL_PATH)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Ensure {data_path} is available.")
        
    df = pd.read_csv(data_path)
    if 'SEQN' in df.columns:
        df = df.drop(columns=['SEQN'])
        
    features_list = list(df.columns)
    cat_cols = []
    cont_cols = []
    for col in features_list:
        if not pd.api.types.is_numeric_dtype(df[col]) or df[col].nunique() < 10:
            cat_cols.append(col)
        else:
            cont_cols.append(col)
            
    cols_with_missing_cont = [col for col in cont_cols if df[col].isna().any()]
    indicator_cols_cont = [f"{col}_is_missing" for col in cols_with_missing_cont]
    
    new_indicator_cols = {}
    for col in cols_with_missing_cont:
        new_indicator_cols[f"{col}_is_missing"] = df[col].isna().astype(float)
    if new_indicator_cols:
        indicators_df = pd.DataFrame(new_indicator_cols, index=df.index)
        df = pd.concat([df, indicators_df], axis=1)
        
    if len(cont_cols) > 0:
        df[cont_cols] = df.fillna(df.mean(numeric_only=True))[cont_cols]

    dummy_dfs = []
    cat_dimensions = []
    cat_columns_ordered = []
    for cat_col in cat_cols:
        df[cat_col] = df[cat_col].fillna("Missing")
        dummies = pd.get_dummies(df[cat_col], prefix=cat_col).astype(float)
        dummy_dfs.append(dummies)
        cat_dimensions.append(dummies.shape[1])
        cat_columns_ordered.append(cat_col)
        
    all_dummies_df = pd.concat(dummy_dfs, axis=1) if dummy_dfs else pd.DataFrame()
        
    cont_bounds = {}
    for col in cont_cols:
        cont_bounds[col] = {'min': df[col].min(), 'max': df[col].max()}

    scaler = QuantileTransformer(output_distribution='normal', random_state=42)
    if len(cont_cols) > 0:
        scaled_cont = scaler.fit_transform(df[cont_cols])
    
    num_cont_and_ind = len(cont_cols) + len(indicator_cols_cont)
    num_cat = all_dummies_df.shape[1] if not all_dummies_df.empty else 0

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    generator = Generator(LATENT_DIM, num_cont_and_ind, num_cat, cat_dimensions).to(device)

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file {model_path} not found.")
        
    generator.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
    generator.eval()

    system_state = {
        'generator': generator,
        'scaler': scaler,
        'device': device,
        'cont_cols': cont_cols,
        'indicator_cols_cont': indicator_cols_cont,
        'cols_with_missing_cont': cols_with_missing_cont,
        'cat_cols': cat_cols,
        'num_cat': num_cat,
        'num_cont_and_ind': num_cont_and_ind,
        'cat_columns_ordered': cat_columns_ordered,
        'cat_dimensions': cat_dimensions,
        'all_dummies_df_columns': all_dummies_df.columns,
        'cont_bounds': cont_bounds,
        'features_list': features_list
    }
    return system_state

def generate_patient_data(system_state, flags):
    """
    Generates a single patient matching the `flags` criteria.
    Returns the Pandas Series of the row.
    """
    generator = system_state['generator']
    scaler = system_state['scaler']
    device = system_state['device']
    cont_cols = system_state['cont_cols']
    indicator_cols_cont = system_state['indicator_cols_cont']
    cols_with_missing_cont = system_state['cols_with_missing_cont']
    num_cat = system_state['num_cat']
    num_cont_and_ind = system_state['num_cont_and_ind']
    cat_columns_ordered = system_state['cat_columns_ordered']
    cat_dimensions = system_state['cat_dimensions']
    all_dummies_df_columns = system_state['all_dummies_df_columns']
    cont_bounds = system_state['cont_bounds']
    features_list = system_state['features_list']

    attempts = 0
    match_found = False
    selected_row = None
    
    while not match_found:
        attempts += 1
        z = torch.randn(BATCH_SIZE_INFERENCE, LATENT_DIM, device=device)
        with torch.no_grad():
            generated_scaled_all = generator(z).cpu().numpy()
            
        generated_df = pd.DataFrame(index=range(BATCH_SIZE_INFERENCE))
        
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

        if num_cat > 0:
            cat_start_idx = num_cont_and_ind
            gen_cat_raw = generated_scaled_all[:, cat_start_idx:]
            current_idx = 0
            new_cat_cols = {}
            for i, col in enumerate(cat_columns_ordered):
                dim = cat_dimensions[i]
                col_logits = gen_cat_raw[:, current_idx:current_idx+dim]
                dummy_cols = all_dummies_df_columns[current_idx:current_idx+dim]
                cat_classes = dummy_cols.str.replace(f"{col}_", "", regex=False).values
                predicted = np.argmax(col_logits, axis=1)
                col_data = pd.Series(cat_classes[predicted])
                col_data = col_data.replace("Missing", np.nan)
                
                try:
                    new_cat_cols[col] = pd.to_numeric(col_data)
                except (ValueError, TypeError):
                    new_cat_cols[col] = col_data
                current_idx += dim
                
            cat_reconstructed_df = pd.DataFrame(new_cat_cols)
            generated_df = pd.concat([generated_df, cat_reconstructed_df], axis=1)

        generated_df = generated_df[[c for c in features_list if c in generated_df.columns]]

        if len(cont_cols) > 0:
            for col in cont_cols:
                generated_df[col] = generated_df[col].clip(lower=cont_bounds[col]['min'], upper=cont_bounds[col]['max'])
                
        if "RIDAGEYR" in generated_df.columns:
            generated_df["RIDAGEYR"] = generated_df["RIDAGEYR"].clip(upper=80.0)

            infants_mask = generated_df["RIDAGEYR"] < 2
            if "DR1TKCAL" in generated_df.columns: generated_df.loc[infants_mask, "DR1TKCAL"] = generated_df.loc[infants_mask, "DR1TKCAL"].clip(upper=1500.0)
            if "DR1TSODI" in generated_df.columns: generated_df.loc[infants_mask, "DR1TSODI"] = generated_df.loc[infants_mask, "DR1TSODI"].clip(upper=1500.0)

            toddler_mask = (generated_df["RIDAGEYR"] >= 2) & (generated_df["RIDAGEYR"] < 6)
            if "DR1TKCAL" in generated_df.columns: generated_df.loc[toddler_mask, "DR1TKCAL"] = generated_df.loc[toddler_mask, "DR1TKCAL"].clip(upper=2500.0)
            if "DR1TSODI" in generated_df.columns: generated_df.loc[toddler_mask, "DR1TSODI"] = generated_df.loc[toddler_mask, "DR1TSODI"].clip(upper=2500.0)
                
            kids_mask = (generated_df["RIDAGEYR"] >= 6) & (generated_df["RIDAGEYR"] < 10)
            if "DR1TKCAL" in generated_df.columns: generated_df.loc[kids_mask, "DR1TKCAL"] = generated_df.loc[kids_mask, "DR1TKCAL"].clip(upper=3500.0)
            if "DR1TSODI" in generated_df.columns: generated_df.loc[kids_mask, "DR1TSODI"] = generated_df.loc[kids_mask, "DR1TSODI"].clip(upper=3500.0)
                
            survival_mask = generated_df["RIDAGEYR"] >= 10
            if "DR1TKCAL" in generated_df.columns: generated_df.loc[survival_mask, "DR1TKCAL"] = generated_df.loc[survival_mask, "DR1TKCAL"].clip(lower=500.0)

            age_lt_8 = generated_df["RIDAGEYR"] < 8
            age_lt_16 = generated_df["RIDAGEYR"] < 16
            
            if "BPXOSY1" in generated_df.columns: generated_df.loc[age_lt_8, "BPXOSY1"] = np.nan
            if "BPXODI1" in generated_df.columns: generated_df.loc[age_lt_8, "BPXODI1"] = np.nan
            if "SLD012" in generated_df.columns: generated_df.loc[age_lt_16, "SLD012"] = np.nan
            if "DBQ010" in generated_df.columns: generated_df.loc[age_lt_16, "DBQ010"] = np.nan
                
            dpq_cols = [f"DPQ0{i}0" for i in range(1, 10)]
            for c in dpq_cols:
                if c in generated_df.columns:
                    generated_df.loc[age_lt_16, c] = np.nan

        if all(col in generated_df.columns for col in ["BMXWT", "BMXHT", "BMXBMI"]):
            calc_bmi = generated_df["BMXWT"] / ((generated_df["BMXHT"] / 100.0) ** 2)
            valid_mask = generated_df["BMXWT"].notna() & generated_df["BMXHT"].notna()
            generated_df.loc[valid_mask, "BMXBMI"] = calc_bmi[valid_mask]
                
        for i in range(BATCH_SIZE_INFERENCE):
            row = generated_df.iloc[i]
            match = True
            
            if flags.get("low_income"):
                if pd.isna(row.get("INDFMPIR")) or row["INDFMPIR"] >= 1.0: match = False
            if flags.get("severe_depression"):
                dpq_cols = [f"DPQ0{x}0" for x in range(1, 10)]
                dpq_vals = [row.get(c, float('nan')) for c in dpq_cols]
                score = sum(int(max(0, min(3, v))) for v in dpq_vals if pd.notna(v))
                if score < 15: match = False
            if flags.get("obese"):
                if pd.isna(row.get("BMXBMI")) or row["BMXBMI"] < 30.0: match = False
            if flags.get("hypertension"):
                sys_bp = row.get("BPXOSY1", np.nan)
                dia_bp = row.get("BPXODI1", np.nan)
                if pd.isna(sys_bp) or pd.isna(dia_bp) or (sys_bp < 140 and dia_bp < 90): match = False
            if flags.get("high_calorie"):
                if pd.isna(row.get("DR1TKCAL")) or row["DR1TKCAL"] <= 2500: match = False
            if flags.get("pediatric"):
                if pd.isna(row.get("RIDAGEYR")) or row["RIDAGEYR"] >= 18: match = False
            if flags.get("geriatric"):
                if pd.isna(row.get("RIDAGEYR")) or row["RIDAGEYR"] < 65: match = False
            if flags.get("underweight"):
                if pd.isna(row.get("BMXBMI")) or row["BMXBMI"] >= 18.5: match = False
            if flags.get("diabetic"):
                if pd.isna(row.get("LBXGH")) or row["LBXGH"] < 6.5: match = False
            if flags.get("prediabetic"):
                if pd.isna(row.get("LBXGH")) or row["LBXGH"] < 5.7 or row["LBXGH"] >= 6.5: match = False
            if flags.get("high_cholesterol"):
                if pd.isna(row.get("LBXTC")) or row["LBXTC"] < 240: match = False
            if flags.get("high_ldl"):
                if pd.isna(row.get("LBDLDL")) or row["LBDLDL"] < 160: match = False
            if flags.get("albuminuria"):
                if pd.isna(row.get("URXUMA")) or row["URXUMA"] <= 30: match = False
            if flags.get("low_calorie"):
                if pd.isna(row.get("DR1TKCAL")) or row["DR1TKCAL"] >= 1200: match = False
            if flags.get("high_sodium"):
                if pd.isna(row.get("DR1TSODI")) or row["DR1TSODI"] <= 2300: match = False
            if flags.get("poor_diet"):
                if pd.isna(row.get("DBQ010")) or row["DBQ010"] not in [4.0, 5.0]: match = False
            if flags.get("food_insecure"):
                if pd.isna(row.get("FSDAD")) or row["FSDAD"] not in [2.0, 3.0, 4.0]: match = False
            if flags.get("insomnia"):
                if pd.isna(row.get("SLD012")) or row["SLD012"] >= 5.0: match = False
            if flags.get("sedentary"):
                if pd.isna(row.get("PAD680")) or row["PAD680"] <= 480: match = False
                    
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

            _sleep = row.get("SLD012", np.nan)
            if pd.notna(_sleep) and not (2.0 <= _sleep <= 18.0): match = False
                
            _sys = row.get("BPXOSY1", np.nan)
            _dia = row.get("BPXODI1", np.nan)
            if pd.notna(_sys) and not (70.0 <= _sys <= 230.0): match = False
            if pd.notna(_dia) and not (40.0 <= _dia <= 140.0): match = False
            if pd.notna(_sys) and pd.notna(_dia) and (_sys < _dia + 10.0): match = False
                
            _hba1c = row.get("LBXGH", np.nan)
            if pd.notna(_hba1c) and not (3.5 <= _hba1c <= 18.0): match = False
                
            _carbs = row.get("DR1TCARB", np.nan)
            _sugars = row.get("DR1TSUGR", np.nan)
            _fiber = row.get("DR1TFIBE", np.nan)
            if pd.notna(_carbs) and pd.notna(_sugars) and pd.notna(_fiber):
                if _carbs < _sugars + _fiber: match = False
                
            _tc = row.get("LBXTC", np.nan)
            _hdl = row.get("LBDHDD", np.nan)
            _ldl = row.get("LBDLDL", np.nan)
            if pd.notna(_tc) and pd.notna(_hdl) and pd.notna(_ldl):
                if _tc < _hdl + _ldl: match = False
                
            _sedentary = row.get("PAD680", np.nan)
            if pd.notna(_sleep) and pd.notna(_sedentary):
                if (_sleep * 60.0) + _sedentary > 1440.0: match = False
                
            _waist = row.get("BMXWAIST", np.nan)
            if pd.notna(_waist) and pd.notna(_ht) and (_waist >= _ht): match = False
            if pd.notna(_age) and _age >= 18 and pd.notna(_waist) and _waist < 50.0: match = False
                
            _kcal = row.get("DR1TKCAL", np.nan)
            _prot = row.get("DR1TPROT", np.nan)
            _fat = row.get("DR1TTFAT", np.nan)
            if pd.notna(_kcal) and pd.notna(_prot) and pd.notna(_carbs) and pd.notna(_fat):
                macro_kcal = (_prot * 4.0) + (_carbs * 4.0) + (_fat * 9.0)
                if _kcal < macro_kcal: match = False
                
            _pov = row.get("INDFMPIR", np.nan)
            if pd.notna(_pov) and not (0.0 <= _pov <= 5.0): match = False
            
            _ucr = row.get("URXUCR", np.nan)
            if pd.notna(_ucr) and _ucr < 10.0: match = False

            if match:
                selected_row = row
                match_found = True
                break
                
    return selected_row

def main():
    parser = argparse.ArgumentParser(description="Generate targeted synthetic patient.")
    parser.add_argument("--low-income", action="store_true")
    parser.add_argument("--severe-depression", action="store_true")
    parser.add_argument("--obese", action="store_true")
    parser.add_argument("--hypertension", action="store_true")
    parser.add_argument("--high-calorie", action="store_true")
    parser.add_argument("--pediatric", action="store_true")
    parser.add_argument("--geriatric", action="store_true")
    parser.add_argument("--underweight", action="store_true")
    parser.add_argument("--diabetic", action="store_true")
    parser.add_argument("--prediabetic", action="store_true")
    parser.add_argument("--high-cholesterol", action="store_true")
    parser.add_argument("--high-ldl", action="store_true")
    parser.add_argument("--albuminuria", action="store_true")
    parser.add_argument("--low-calorie", action="store_true")
    parser.add_argument("--high-sodium", action="store_true")
    parser.add_argument("--poor-diet", action="store_true")
    parser.add_argument("--food-insecure", action="store_true")
    parser.add_argument("--insomnia", action="store_true")
    parser.add_argument("--sedentary", action="store_true")
    args = parser.parse_args()
    
    flags = vars(args)
    
    print("Loading AI Models and Scalers...")
    system_state = initialize_system()
    
    print("Searching for a patient matching the requested criteria...")
    selected_row = generate_patient_data(system_state, flags)
    
    from generate_reports import generate_report
    OUTPUT_DIR = "patient_reports"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    flag_str_list = [k for k, v in flags.items() if v]
    flag_str = "_".join(flag_str_list) if flag_str_list else "random"
    out_file = os.path.join(OUTPUT_DIR, f"targeted_patient_{flag_str}.md")
    
    report_md = generate_report(selected_row, index=999)
    with open(out_file, "w") as f:
        f.write(report_md)
        
    print(f"Successfully generated custom Markdown report in: {out_file}")

if __name__ == "__main__":
    main()
