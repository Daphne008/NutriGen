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

EPOCHS = 2000
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

    class Critic(nn.Module): 
        def __init__(self, input_dim):
            super(Critic, self).__init__()
            self.model = nn.Sequential(
                nn.Linear(input_dim, 512),
                nn.LeakyReLU(0.2),
                nn.Dropout(0.3),
                nn.Linear(512, 512),
                nn.LeakyReLU(0.2),
                nn.Dropout(0.3),
                nn.Linear(512, 256),
                nn.LeakyReLU(0.2),
                nn.Linear(256, 1)
            )

        def forward(self, x):
            return self.model(x)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using PyTorch device: {device}")

    generator = Generator(LATENT_DIM, num_cont_and_ind, num_cat).to(device)
    critic = Critic(input_dim).to(device)
    
    MODEL_PATH = "nutrigen_gan_v6.pth"
    RETRAIN = "--retrain" in sys.argv
    
    if os.path.exists(MODEL_PATH) and not RETRAIN:
        print(f"Loading existing model from {MODEL_PATH} (Use --retrain to overwrite)...")
        generator.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=True))
        epochs_to_run = 0
    else:
        epochs_to_run = EPOCHS

    # WGAN-GP hyperparameter
    LAMBDA_GP = 10 
    CRITIC_ITERATIONS = 5

    c_optimizer = optim.Adam(critic.parameters(), lr=1e-4, betas=(0.5, 0.9))
    g_optimizer = optim.Adam(generator.parameters(), lr=1e-4, betas=(0.5, 0.9))

    # Statistical Metric: MMD (Maximum Mean Discrepancy) with RBF Kernel
    def compute_mmd(x, y, sigma=1.0):
        if x.size(0) > 500: x = x[:500]
        if y.size(0) > 500: y = y[:500]
        
        xx, yy, zz = torch.mm(x, x.t()), torch.mm(y, y.t()), torch.mm(x, y.t())
        rx = (xx.diag().unsqueeze(0).expand_as(xx))
        ry = (yy.diag().unsqueeze(0).expand_as(yy))
        dxx = rx.t() + rx - 2. * xx
        dyy = ry.t() + ry - 2. * yy
        dxy = rx.t() + ry - 2. * zz
        
        K_XX = torch.exp(-dxx / (2.0 * sigma**2))
        K_YY = torch.exp(-dyy / (2.0 * sigma**2))
        K_XY = torch.exp(-dxy / (2.0 * sigma**2))
        
        return K_XX.mean() + K_YY.mean() - 2. * K_XY.mean()

    def compute_gradient_penalty(critic, real_samples, fake_samples):
        alpha = torch.randn((real_samples.size(0), 1), device=real_samples.device)
        interpolates = (alpha * real_samples + ((1 - alpha) * fake_samples)).requires_grad_(True)
        critic_interpolates = critic(interpolates)
        
        fake = torch.ones(real_samples.size(0), 1, device=real_samples.device)
        gradients = torch.autograd.grad(
            outputs=critic_interpolates,
            inputs=interpolates,
            grad_outputs=fake,
            create_graph=True,
            retain_graph=True,
            only_inputs=True,
        )[0]
        
        gradients = gradients.view(gradients.size(0), -1)
        gradient_penalty = ((gradients.norm(2, dim=1) - 1) ** 2).mean()
        return gradient_penalty

    # 4. Training Loop
    if epochs_to_run > 0:
        print(f"Starting dynamic WGAN-GP training for {epochs_to_run} epochs on {input_dim} total node dimensions...")
        
    for epoch in range(epochs_to_run):
        for idx, real_data in enumerate(data_loader):
            real_data = real_data.to(device)
            batch_size = real_data.size(0)
            
            #  Train Critic
            for _ in range(CRITIC_ITERATIONS):
                z = torch.randn(batch_size, LATENT_DIM, device=device)
                fake_data = generator(z).detach()

                c_optimizer.zero_grad()
                
                loss_critic = -(torch.mean(critic(real_data)) - torch.mean(critic(fake_data)))
                gradient_penalty = compute_gradient_penalty(critic, real_data, fake_data)
                
                loss_critic += LAMBDA_GP * gradient_penalty
                
                loss_critic.backward()
                c_optimizer.step()

            #  Train Generator
            g_optimizer.zero_grad()
            z = torch.randn(batch_size, LATENT_DIM, device=device)
            fake_data = generator(z)
            
            loss_generator = -torch.mean(critic(fake_data))
            loss_generator.backward()
            g_optimizer.step()

        if epochs_to_run > 0 and (epoch + 1) % 5 == 0:
            mmd_score = compute_mmd(real_data, fake_data.detach())
            print(f"Epoch [{epoch+1}/{epochs_to_run}] | Critic Loss: {loss_critic.item():.4f} | G Loss: {loss_generator.item():.4f} | MMD: {mmd_score.item():.4f}")

    if epochs_to_run > 0:
        torch.save(generator.state_dict(), MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")

    # 5. Generate Sample Profiles
    print("Generating synthetic patient profiles using Vectorized Rejection Sampling...")
    num_samples = 100
    
    valid_dfs = []
    total_valid = 0
    batch_size = max(num_samples, 500)
    
    while total_valid < num_samples:
        z = torch.randn(batch_size, LATENT_DIM, device=device)

        with torch.no_grad():
            generated_scaled_all = generator(z).cpu().numpy()
            
        generated_df = pd.DataFrame(index=range(batch_size))
        
        # Reconstruct Continuous Features & Missingness
        if len(cont_cols) > 0:
            gen_cont_scaled = generated_scaled_all[:, :len(cont_cols)]
            generated_cont = scaler.inverse_transform(gen_cont_scaled)
            cont_reconstructed_df = pd.DataFrame(generated_cont, columns=cont_cols)
            generated_df = pd.concat([generated_df, cont_reconstructed_df], axis=1)

            # Apply Missingness Masks
            if indicator_cols_cont:
                start_idx = len(cont_cols)
                end_idx = start_idx + len(indicator_cols_cont)
                gen_indicators_raw = generated_scaled_all[:, start_idx:end_idx]
                gen_indicators = (gen_indicators_raw > 1.0).astype(float)
                
                for idx, col in enumerate(cols_with_missing_cont):
                    is_missing_mask = gen_indicators[:, idx] == 1.0
                    generated_df.loc[is_missing_mask, col] = np.nan

        # Decode Categorical Variables Dynamically
        if num_cat > 0:
            cat_start_idx = num_cont_and_ind
            gen_cat_raw = generated_scaled_all[:, cat_start_idx:]
            
            current_idx = 0
            new_cat_cols = {}
            for i, col in enumerate(cat_columns_ordered):
                dim = cat_dimensions[i]
                col_logits = gen_cat_raw[:, current_idx:current_idx+dim]
                
                dummy_cols_for_this_cat = all_dummies_df.columns[current_idx:current_idx+dim]
                cat_classes = dummy_cols_for_this_cat.str.replace(f"{col}_", "", regex=False).values
                
                predicted_class_indices = np.argmax(col_logits, axis=1)
                col_data = pd.Series(cat_classes[predicted_class_indices])
                
                col_data = col_data.replace("Missing", np.nan)
                
                try:
                    new_cat_cols[col] = pd.to_numeric(col_data)
                except (ValueError, TypeError):
                    new_cat_cols[col] = col_data
                
                current_idx += dim
                
            cat_reconstructed_df = pd.DataFrame(new_cat_cols)
            generated_df = pd.concat([generated_df, cat_reconstructed_df], axis=1)

        # Reorder output columns to perfectly match the input CSV order
        generated_df = generated_df[[c for c in FEATURES if c in generated_df.columns]]

        # Base Structural Bounds (These remain as clips because they represent NHANES technical boundaries, not biology)
        if len(cont_cols) > 0:
            for col in cont_cols:
                min_bound = cont_bounds[col]['min']
                max_bound = cont_bounds[col]['max']
                generated_df[col] = generated_df[col].clip(lower=min_bound, upper=max_bound)
                
        if "RIDAGEYR" in generated_df.columns:
            generated_df["RIDAGEYR"] = generated_df["RIDAGEYR"].clip(upper=80.0)

        # Pediatric Structural Missingness
        if "RIDAGEYR" in generated_df.columns:
            age_lt_8 = generated_df["RIDAGEYR"] < 8
            age_lt_16 = generated_df["RIDAGEYR"] < 16
            
            if "BPXOSY1" in generated_df.columns:
                generated_df.loc[age_lt_8, "BPXOSY1"] = np.nan
            if "BPXODI1" in generated_df.columns:
                generated_df.loc[age_lt_8, "BPXODI1"] = np.nan
                
            if "SLD012" in generated_df.columns:
                generated_df.loc[age_lt_16, "SLD012"] = np.nan
            if "DBQ010" in generated_df.columns:
                generated_df.loc[age_lt_16, "DBQ010"] = np.nan
                
            dpq_cols = [f"DPQ0{i}0" for i in range(1, 10)]
            for c in dpq_cols:
                if c in generated_df.columns:
                    generated_df.loc[age_lt_16, c] = np.nan

        # 3. Deterministic Recalculation
        if all(col in generated_df.columns for col in ["BMXWT", "BMXHT", "BMXBMI"]):
            calc_bmi = generated_df["BMXWT"] / ((generated_df["BMXHT"] / 100.0) ** 2)
            valid_mask = generated_df["BMXWT"].notna() & generated_df["BMXHT"].notna()
            generated_df.loc[valid_mask, "BMXBMI"] = calc_bmi[valid_mask]

        # Vectorized Rejection Sampling Mask
        valid_rows = pd.Series(True, index=generated_df.index)
        
        # Pediatric Physics (CDC Growth Bounds)
        _age = generated_df.get("RIDAGEYR")
        _ht = generated_df.get("BMXHT")
        _wt = generated_df.get("BMXWT")
        if _age is not None:
            # Infants
            m = (_age < 2)
            if _ht is not None: valid_rows &= ~(m & _ht.notna() & ((_ht < 45.0) | (_ht > 90.0)))
            if _wt is not None: valid_rows &= ~(m & _wt.notna() & ((_wt < 2.5) | (_wt > 15.0)))
            # Toddlers
            m = (_age >= 2) & (_age < 6)
            if _ht is not None: valid_rows &= ~(m & _ht.notna() & ((_ht < 80.0) | (_ht > 115.0)))
            if _wt is not None: valid_rows &= ~(m & _wt.notna() & ((_wt < 10.0) | (_wt > 24.0)))
            # Children
            m = (_age >= 6) & (_age < 10)
            if _ht is not None: valid_rows &= ~(m & _ht.notna() & ((_ht < 105.0) | (_ht > 140.0)))
            if _wt is not None: valid_rows &= ~(m & _wt.notna() & ((_wt < 16.0) | (_wt > 40.0)))
            # Teens
            m = (_age >= 10) & (_age < 14)
            if _ht is not None: valid_rows &= ~(m & _ht.notna() & ((_ht < 130.0) | (_ht > 165.0)))
            if _wt is not None: valid_rows &= ~(m & _wt.notna() & ((_wt < 26.0) | (_wt > 65.0)))
            # Older Teens
            m = (_age >= 14) & (_age < 18)
            if _ht is not None: valid_rows &= ~(m & _ht.notna() & ((_ht < 150.0) | (_ht > 185.0)))
            if _wt is not None: valid_rows &= ~(m & _wt.notna() & ((_wt < 40.0) | (_wt > 85.0)))

        # Absolute Blood Pressure
        _sys = generated_df.get("BPXOSY1")
        _dia = generated_df.get("BPXODI1")
        if _sys is not None: valid_rows &= ~(_sys.notna() & ((_sys < 70.0) | (_sys > 230.0)))
        if _dia is not None: valid_rows &= ~(_dia.notna() & ((_dia < 40.0) | (_dia > 140.0)))
        if _sys is not None and _dia is not None:
            valid_rows &= ~((_sys.notna() & _dia.notna()) & (_sys < _dia + 10.0))

        # Blood Sugar Limits
        _hba1c = generated_df.get("LBXGH")
        if _hba1c is not None: valid_rows &= ~(_hba1c.notna() & ((_hba1c < 3.5) | (_hba1c > 18.0)))
            
        # Carbohydrate Physics
        _carbs = generated_df.get("DR1TCARB")
        _sugars = generated_df.get("DR1TSUGR")
        _fiber = generated_df.get("DR1TFIBE")
        if _carbs is not None and _sugars is not None and _fiber is not None:
            valid_rows &= ~((_carbs.notna() & _sugars.notna() & _fiber.notna()) & (_carbs < _sugars + _fiber))
            
        # Lipid Fractions
        _tc = generated_df.get("LBXTC")
        _hdl = generated_df.get("LBDHDD")
        _ldl = generated_df.get("LBDLDL")
        if _tc is not None and _hdl is not None and _ldl is not None:
            valid_rows &= ~((_tc.notna() & _hdl.notna() & _ldl.notna()) & (_tc < _hdl + _ldl))
            
        # Time Continuity
        _sleep = generated_df.get("SLD012")
        _sedentary = generated_df.get("PAD680")
        if _sleep is not None and _sedentary is not None:
            valid_rows &= ~((_sleep.notna() & _sedentary.notna()) & ((_sleep * 60.0) + _sedentary > 1440.0))
        if _sleep is not None:
            valid_rows &= ~(_sleep.notna() & ((_sleep < 2.0) | (_sleep > 18.0)))

        # Waist-Height Limit & Floors
        _waist = generated_df.get("BMXWAIST")
        if _waist is not None and _ht is not None:
            valid_rows &= ~((_waist.notna() & _ht.notna()) & (_waist >= _ht))
        if _waist is not None and _age is not None:
            valid_rows &= ~((_age.notna() & _waist.notna()) & (_age >= 18) & (_waist < 50.0))
            
        # Caloric Mathematics
        _kcal = generated_df.get("DR1TKCAL")
        _prot = generated_df.get("DR1TPROT")
        _fat = generated_df.get("DR1TTFAT")
        if _kcal is not None and _prot is not None and _carbs is not None and _fat is not None:
            macro_kcal = (_prot * 4.0) + (_carbs * 4.0) + (_fat * 9.0)
            valid_rows &= ~((_kcal.notna() & _prot.notna() & _carbs.notna() & _fat.notna()) & (_kcal < macro_kcal))
            
        # Poverty Ratio & Creatinine Boundaries
        _pov = generated_df.get("INDFMPIR")
        if _pov is not None: valid_rows &= ~(_pov.notna() & ((_pov < 0.0) | (_pov > 5.0)))
        _ucr = generated_df.get("URXUCR")
        if _ucr is not None: valid_rows &= ~(_ucr.notna() & (_ucr < 10.0))
        
        # Filter Batch
        valid_batch = generated_df[valid_rows]
        valid_dfs.append(valid_batch)
        total_valid += len(valid_batch)
        
    # Trim to exact num_samples and export
    generated_df = pd.concat(valid_dfs).iloc[:num_samples]
    
    generated_df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {num_samples} generated profiles to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
