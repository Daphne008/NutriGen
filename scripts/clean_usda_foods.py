import pandas as pd

df = pd.read_csv("data/raw/usda_foods_raw.csv")

df = df.dropna(subset=["description"])
df = df.drop_duplicates(subset=["fdc_id"])

number_cols = ["calories", "protein_g", "fat_g", "carbs_g"]

for col in number_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

df["description"] = df["description"].str.lower().str.strip()

df = df[df["calories"] > 0]

df.to_csv("data/processed/foods_clean.csv", index=False)
df.to_json("data/processed/foods_clean.json", orient="records", indent=2)

print("Clean data saved successfully!")
print(df.head())