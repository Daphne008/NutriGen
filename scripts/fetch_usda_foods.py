import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

API_KEY = "7XZBtte2g74E0BZmReFoGJjRpgCPVYdK2haCNNGC"
BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

SEARCH_TERMS = [
    "chicken breast", "rice", "egg", "milk", "banana",
    "apple", "salmon", "oats", "bread", "potato"
]

NUTRIENTS = {
    "Energy": "calories",
    "Protein": "protein_g",
    "Total lipid (fat)": "fat_g",
    "Carbohydrate, by difference": "carbs_g"
}

def extract_nutrients(food):
    result = {
        "fdc_id": food.get("fdcId"),
        "description": food.get("description")
    }

    for col in NUTRIENTS.values():
        result[col] = None

    for nutrient in food.get("foodNutrients", []):
        name = nutrient.get("nutrientName")
        value = nutrient.get("value")

        if name in NUTRIENTS:
            result[NUTRIENTS[name]] = value

    return result

all_foods = []

for term in SEARCH_TERMS:
    print(f"Fetching: {term}")

    params = {
        "api_key": API_KEY,
        "query": term,
        "pageSize": 20
    }

    response = requests.get(BASE_URL, params=params)
    data = response.json()

    foods = data.get("foods", [])

    for food in foods:
        all_foods.append(extract_nutrients(food))

    time.sleep(1)

df = pd.DataFrame(all_foods)

df.to_csv("data/raw/usda_foods_raw.csv", index=False)

print("Data saved successfully!")