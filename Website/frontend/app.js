// Application State
let currentPatientRawData = null;
let currentWarnings = [];
const studentDiagnoses = new Set(); // Stores Strings representing student's tracked diagnoses
let activePopupElement = null;

// DOM Elements
const btnGenerate = document.getElementById('btn-generate');
const loadingIndicator = document.getElementById('loading-indicator');
const clinicalContent = document.getElementById('clinical-content');
const dietPlanner = document.getElementById('diet-planner');
const notesArea = document.getElementById('clinical-notes');
const popupsContainer = document.getElementById('diagnostic-popups-container');

// Diet Planner DOM
const mealBlocksContainer = document.getElementById('meal-blocks-container');
const foodSearchModal = document.getElementById('food-search-modal');
const foodSearchInput = document.getElementById('food-search-input');
const foodSearchResults = document.getElementById('food-search-results');
const btnCloseSearch = document.getElementById('btn-close-search');
const btnSubmitPlan = document.getElementById('btn-submit-plan');

let currentDietPlan = [
    { name: 'Early Morning Snack', foods: [] },
    { name: 'Breakfast', foods: [] },
    { name: 'Mid-Morning Snack', foods: [] },
    { name: 'Lunch', foods: [] },
    { name: 'Afternoon Snack', foods: [] },
    { name: 'Dinner', foods: [] },
    { name: 'Evening Snack', foods: [] }
];
let activeBlockIndex = null;
let currentSearchFoods = [];

// Pathology Mapping for Interactive UI
const PATHOLOGY_OPTIONS = {
    "bmi": ["Underweight", "Overweight", "Obesity"],
    "cvd": ["High Cardiovascular Risk"],
    "bp": ["Elevated BP", "Hypertension (Stage 1)", "Hypertension (Stage 2)"],
    "lipids": ["Hyperlipidemia", "High LDL", "High TC/HDL Ratio", "Elevated LDL/HDL"],
    "diabetes": ["Prediabetic Range", "Diabetic Range"],
    "kidney": ["Elevated Albuminuria", "High ACR (Proteinuria)"],
    "poverty": ["Below Poverty Line"]
};

// Map exact warning strings to UI-friendly internal hashes
const DIAGNOSIS_TO_SERVER_WARNING = {
    "Obesity": "Unknown", // Handled by BMI logic, fake mapping for exact match mechanics, let's treat it safely
    "Hypertension (Stage 1)": "Hypertension (Stage 1)",
    "Hypertension (Stage 2)": "Hypertension (Stage 2)",
    "Elevated BP": "Elevated BP",
    "High Cardiovascular Risk": "High Cardiovascular Risk",
    "Hyperlipidemia": "Hyperlipidemia (High Total Chol)",
    "High LDL": "High LDL",
    "Prediabetic Range": "Prediabetic Range",
    "Diabetic Range": "Diabetic Range",
    "Elevated Albuminuria": "Elevated Albuminuria",
    "High ACR (Proteinuria)": "High ACR (Proteinuria)",
    "High TC/HDL Ratio": "High TC/HDL Ratio",
    "Elevated LDL/HDL": "Elevated LDL/HDL",
    "Below Poverty Line": "Below Poverty Line"
};

async function generatePatient() {
    // 1. UI Loading State
    btnGenerate.disabled = true;
    loadingIndicator.classList.remove('hidden');
    studentDiagnoses.clear();
    popupsContainer.innerHTML = '';
    
    // 2. Gather Flags from multi-select
    const select = document.getElementById('flag-select');
    const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
    
    const flags = {
        obese: selectedOptions.includes('obese'),
        diabetic: selectedOptions.includes('diabetic'),
        hypertension: selectedOptions.includes('hypertension'),
        pediatric: selectedOptions.includes('pediatric'),
        geriatric: selectedOptions.includes('geriatric'),
        severe_depression: selectedOptions.includes('severe_depression'),
        low_income: selectedOptions.includes('low_income')
    };

    const queryParams = new URLSearchParams(flags).toString();

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/patient/generate?${queryParams}`);
        
        if (!response.ok) throw new Error("Server error or PyTorch failed to load.");
        
        const data = await response.json();
        handlePatientData(data);
    } catch (error) {
        console.error("Backend API not reachable.", error);
        alert("Failed to generate patient data. Please ensure the backend server is running.");
    }

    // Reset UI
    btnGenerate.disabled = false;
    loadingIndicator.classList.add('hidden');
    document.getElementById('generation-modal').classList.add('hidden');
    document.getElementById('btn-new-patient').classList.remove('hidden');
}


function handlePatientData(data) {
    const analysis = data.patient_analysis;
    currentPatientRawData = data.raw_base_data;
    
    // Explicitly hide the warnings from the student instead of rendering them
    currentWarnings = analysis.warnings || [];

    // Demographics
    document.getElementById('val-age').innerText = typeof analysis.demographics.age === 'number' ? Math.floor(analysis.demographics.age) : analysis.demographics.age;
    document.getElementById('val-gender').innerText = analysis.demographics.gender;

    // Anthropometrics
    document.getElementById('val-weight').innerText = `${analysis.anthropometrics.weight_kg?.toFixed(1)} kg`;
    document.getElementById('val-height').innerText = `${analysis.anthropometrics.height_cm?.toFixed(1)} cm`;
    document.getElementById('val-waist').innerText = `${analysis.anthropometrics.waist_cm?.toFixed(1)} cm`;
    document.getElementById('val-whtr').innerText = analysis.anthropometrics.whtr?.toFixed(2) || 'N/A';
    
    const bmiEl = document.getElementById('val-bmi');
    bmiEl.innerText = analysis.anthropometrics.bmi?.toFixed(1);

    // Vitals
    document.getElementById('val-bp').innerText = `${analysis.vitals.bp_systolic?.toFixed(0)}/${analysis.vitals.bp_diastolic?.toFixed(0)} mmHg`;
    document.getElementById('val-chol').innerText = `${analysis.labs.cholesterol_total?.toFixed(0)} mg/dL`;
    document.getElementById('val-hdl').innerText = `${analysis.labs.hdl?.toFixed(0)} mg/dL`;
    document.getElementById('val-ldl').innerText = `${analysis.labs.ldl?.toFixed(0)} mg/dL`;
    document.getElementById('val-tc-hdl').innerText = analysis.labs.tc_hdl_ratio?.toFixed(2) || 'N/A';
    document.getElementById('val-hba1c').innerText = `${analysis.labs.hba1c?.toFixed(1)}%`;
    document.getElementById('val-alb').innerText = `${analysis.labs.urine_albumin?.toFixed(1)} mg/L`;
    document.getElementById('val-urine-creat').innerText = analysis.labs.urine_creatinine ? `${analysis.labs.urine_creatinine.toFixed(1)} mg/dL` : 'N/A';
    document.getElementById('val-acr').innerText = analysis.labs.acr ? `${analysis.labs.acr.toFixed(1)} mg/g` : 'N/A';

    // Dietary Recall
    document.getElementById('val-diet-qual').innerText = analysis.dietary_recall.diet_quality || 'Unknown/Missing';
    document.getElementById('val-food-sec').innerText = analysis.dietary_recall.food_security || 'Unknown/Missing';
    document.getElementById('val-calories').innerText = `${analysis.dietary_recall.calories?.toFixed(0)} kcal`;
    document.getElementById('val-macros').innerText = `(${analysis.dietary_recall.pct_carbs?.toFixed(0)}% C / ${analysis.dietary_recall.pct_fat?.toFixed(0)}% F / ${analysis.dietary_recall.pct_protein?.toFixed(0)}% P)`;
    document.getElementById('val-protein').innerText = `${analysis.dietary_recall.protein_g?.toFixed(1)} g`;
    document.getElementById('val-carbs').innerText = `${analysis.dietary_recall.carbs_g?.toFixed(1)} g`;
    document.getElementById('val-sugars').innerText = `${analysis.dietary_recall.sugars_g?.toFixed(1)} g`;
    document.getElementById('val-fiber').innerText = `${analysis.dietary_recall.fiber_g?.toFixed(1)} g`;
    document.getElementById('val-fat').innerText = `${analysis.dietary_recall.fat_g?.toFixed(1)} g`;
    document.getElementById('val-sodium').innerText = `${analysis.dietary_recall.sodium_mg?.toFixed(0)} mg`;

    // Lifestyle & Socioeconomic
    document.getElementById('val-poverty').innerText = analysis.demographics.poverty_ratio !== undefined ? analysis.demographics.poverty_ratio.toFixed(2) : 'N/A';
    document.getElementById('val-phq9').innerText = analysis.lifestyle.phq9_score !== undefined ? `${analysis.lifestyle.phq9_score} (${analysis.lifestyle.phq9_category || 'N/A'})` : 'N/A';
    document.getElementById('val-sleep').innerText = analysis.lifestyle.sleep_hours ? `${analysis.lifestyle.sleep_hours.toFixed(1)} hours/night` : 'N/A';
    document.getElementById('val-sedentary').innerText = analysis.lifestyle.sedentary_minutes ? `${analysis.lifestyle.sedentary_minutes.toFixed(0)} minutes/day` : 'N/A';

    document.querySelectorAll('.interactive-row').forEach(row => {
        row.classList.remove('active');
        row.style.border = '';
    });

    // Unlock Panels
    clinicalContent.classList.remove('blur-state');
    dietPlanner.classList.remove('blur-state');
    notesArea.classList.remove('blur-state');
    notesArea.value = ''; // clear notes
    btnSubmitPlan.disabled = false;
    document.getElementById('evaluation-result').classList.add('hidden');
    
    // Reset Diet Plan
    currentDietPlan.forEach(b => b.foods = []);
    renderBlocks();
    updateLiveMacros();
}

// Interactive Pathologies Toggle
document.querySelectorAll('.interactive-row').forEach(row => {
    row.addEventListener('click', (e) => {
        if (!currentPatientRawData) return;
        
        const category = row.dataset.category;
        if (!category || !PATHOLOGY_OPTIONS[category]) return;

        // Ensure single popup logic
        if (activePopupElement) {
            activePopupElement.remove();
            document.querySelectorAll('.interactive-row').forEach(r => r.classList.remove('active'));
            if (activePopupElement.dataset.parent === row.id || activePopupElement.dataset.category === category) {
                // Clicking the same row just closes it entirely
                activePopupElement = null;
                return;
            }
        }

        row.classList.add('active');
        const popTemplate = document.getElementById('popup-template').content.cloneNode(true);
        const popup = popTemplate.querySelector('.diagnostic-popup');
        popup.dataset.category = category;
        
        const optsContainer = popup.querySelector('.popup-options');
        PATHOLOGY_OPTIONS[category].forEach(opt => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = opt;
            // Pre-check if already diagnosed by student
            if (studentDiagnoses.has(opt)) checkbox.checked = true;
            
            checkbox.addEventListener('change', (ev) => {
                if (ev.target.checked) studentDiagnoses.add(opt);
                else studentDiagnoses.delete(opt);
            });
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(opt));
            optsContainer.appendChild(label);
        });

        popup.querySelector('.popup-close').addEventListener('click', () => {
            popup.remove();
            row.classList.remove('active');
            activePopupElement = null;
        });

        // Positioning logic relative to the row
        const rect = row.getBoundingClientRect();
        const parentRect = document.querySelector('.report-panel').getBoundingClientRect();
        
        popup.style.top = `${rect.bottom - parentRect.top + 8}px`;
        popup.style.left = `${rect.left - parentRect.left + 24}px`;
        popup.classList.remove('hidden');

        popupsContainer.appendChild(popup);
        activePopupElement = popup;
    });
});

function renderBlocks() {
    mealBlocksContainer.innerHTML = '';
    currentDietPlan.forEach((block, bIdx) => {
        const blockEl = document.createElement('div');
        blockEl.className = 'meal-block';
        
        const header = document.createElement('div');
        header.className = 'meal-block-header';
        header.innerHTML = `<h4>${block.name}</h4> <button type="button" class="btn-tiny" onclick="openSearchModal(${bIdx})">+ Add Food</button>`;
        
        const list = document.createElement('div');
        list.className = 'food-list';
        
        block.foods.forEach((fs, fIdx) => {
            const row = document.createElement('div');
            row.className = 'food-item-row';
            row.innerHTML = `
                <div class="food-item-info">
                    <span class="food-item-name">${fs.food.name}</span>
                    <span class="food-item-serving" data-gramage="${fs.food.serving_grams * fs.servings}g">${fs.servings} x ${fs.food.serving_desc}</span>
                </div>
                <div class="food-item-actions">
                    <button type="button" onclick="removeFood(${bIdx}, ${fIdx})">Remove</button>
                </div>
            `;
            list.appendChild(row);
        });
        
        blockEl.appendChild(header);
        blockEl.appendChild(list);
        mealBlocksContainer.appendChild(blockEl);
    });
}

window.openSearchModal = function(bIdx) {
    activeBlockIndex = bIdx;
    foodSearchModal.classList.remove('hidden');
    foodSearchInput.value = '';
    foodSearchResults.innerHTML = '';
    foodSearchInput.focus();
}

if(btnCloseSearch) {
    btnCloseSearch.addEventListener('click', () => {
        foodSearchModal.classList.add('hidden');
        activeBlockIndex = null;
    });
}

if(foodSearchInput) {
    foodSearchInput.addEventListener('input', async (e) => {
        const q = e.target.value.trim();
        if (q.length < 2) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/foods?query=${q}`);
            const data = await res.json();
            currentSearchFoods = data.foods;
            
            foodSearchResults.innerHTML = '';
            currentSearchFoods.forEach(food => {
                const card = document.createElement('div');
                card.className = 'food-result-card';
                card.innerHTML = `
                    <div>
                        <h5>${food.name}</h5>
                        <p>${food.serving_desc} | ${food.calories} kcal</p>
                    </div>
                    <button type="button" onclick="addFood('${food.id}')">Add 1 Srv</button>
                `;
                foodSearchResults.appendChild(card);
            });
        } catch(e) {
            console.error("Search failed", e);
        }
    });
}

window.addFood = function(foodId) {
    if (activeBlockIndex === null) return;
    const food = currentSearchFoods.find(f => f.id === foodId);
    if (!food) return;
    
    const exist = currentDietPlan[activeBlockIndex].foods.find(f => f.food.id === foodId);
    if (exist) {
        exist.servings += 1;
    } else {
        currentDietPlan[activeBlockIndex].foods.push({ food: food, servings: 1 });
    }
    
    renderBlocks();
    updateLiveMacros();
    
    foodSearchModal.classList.add('hidden');
    activeBlockIndex = null;
};

window.removeFood = function(bIdx, fIdx) {
    currentDietPlan[bIdx].foods.splice(fIdx, 1);
    renderBlocks();
    updateLiveMacros();
};

function updateLiveMacros() {
    let tCal = 0, tPro = 0, tCar = 0, tFat = 0, tSug = 0, tFib = 0, tSod = 0;
    
    currentDietPlan.forEach(b => {
        b.foods.forEach(fs => {
            tCal += fs.food.calories * fs.servings;
            tPro += fs.food.protein_g * fs.servings;
            tCar += fs.food.carbs_g * fs.servings;
            tFat += fs.food.fat_g * fs.servings;
            tSug += fs.food.sugars_g * fs.servings;
            tFib += fs.food.fiber_g * fs.servings;
            tSod += fs.food.sodium_mg * fs.servings;
        });
    });
    
    document.getElementById('live-cal').innerText = `${tCal.toFixed(0)} kcal`;
    document.getElementById('live-pro').innerText = `${tPro.toFixed(1)} g`;
    document.getElementById('live-car').innerText = `${tCar.toFixed(1)} g`;
    document.getElementById('live-fat').innerText = `${tFat.toFixed(1)} g`;
    document.getElementById('live-sug').innerText = `${tSug.toFixed(1)} g`;
    document.getElementById('live-fib').innerText = `${tFib.toFixed(1)} g`;
    document.getElementById('live-sod').innerText = `${tSod.toFixed(0)} mg`;
}

async function evaluateDiet(e) {
    if(e) e.preventDefault();
    if (!currentPatientRawData) return;

    if (activePopupElement) {
        activePopupElement.remove();
        activePopupElement = null;
    }

    btnSubmitPlan.innerText = "Evaluating...";
    btnSubmitPlan.disabled = true;

    const blocksPayload = currentDietPlan.map(b => ({
        name: b.name,
        foods: b.foods.map(fs => ({ food_id: fs.food.id, servings: fs.servings }))
    }));

    const plan = {
        blocks: blocksPayload,
        patient_data: currentPatientRawData
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan)
        });

        if (!response.ok) throw new Error("Backend evaluation failed.");

        const data = await response.json();
        renderEvaluation(data.evaluation);
    } catch (error) {
        console.error("Backend API not reachable.", error);
        alert("Failed to evaluate plan. Please ensure the backend server is running.");
    }
    
    btnSubmitPlan.innerText = "Submit Plan & Diagnosis";
    btnSubmitPlan.disabled = false;
}

function renderEvaluation(postDietEvaluation) {
    const resDiv = document.getElementById('evaluation-result');
    const dietUl = document.getElementById('eval-feedback');
    const diagUl = document.getElementById('eval-diagnostics');
    dietUl.innerHTML = '';
    diagUl.innerHTML = '';

    resDiv.classList.remove('hidden');
    
    /* 1. Dietary Assessment Rendering */
    const liMac = document.createElement('li');
    liMac.innerHTML = `<strong>Macro Distribution:</strong> ${postDietEvaluation.dietary_recall.pct_carbs?.toFixed(0)}% C / ${postDietEvaluation.dietary_recall.pct_fat?.toFixed(0)}% F / ${postDietEvaluation.dietary_recall.pct_protein?.toFixed(0)}% P`;
    dietUl.appendChild(liMac);

    const alerts = postDietEvaluation.clinical_alerts || [];
    if (alerts.length > 0) {
        alerts.forEach(al => {
            const li = document.createElement('li');
            li.innerHTML = `⚠️ <strong>Clinical Alert:</strong> ${al}`;
            dietUl.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.innerHTML = `✅ <strong>Success:</strong> Diet Plan does not contraindicate patient's clinical conditions.`;
        dietUl.appendChild(li);
    }
    
    /* 2. Diagnostic Accuracy Check */
    let serverWarningSet = new Set(currentWarnings);
    // Add logic translation for Obese, since the server calculates it via BMI string dynamically!
    if (currentPatientRawData.BMXBMI >= 30) serverWarningSet.add("Obesity");
    if (currentPatientRawData.BMXBMI >= 25 && currentPatientRawData.BMXBMI < 30) serverWarningSet.add("Overweight");
    if (currentPatientRawData.BMXBMI < 18.5) serverWarningSet.add("Underweight");

    const mappedServerWarnings = new Set();
    serverWarningSet.forEach(w => mappedServerWarnings.add(w));

    let correctCount = 0;
    let missedCount = 0;
    let falseCount = 0;

    // Check student vs server
    studentDiagnoses.forEach(diag => {
        const mappedInternal = DIAGNOSIS_TO_SERVER_WARNING[diag] || diag;
        if (mappedServerWarnings.has(mappedInternal) || mappedServerWarnings.has(diag)) {
            const li = document.createElement('li');
            li.innerHTML = `✅ <strong>Correct identified risk:</strong> ${diag}`;
            diagUl.appendChild(li);
            correctCount++;
        } else {
            const li = document.createElement('li');
            li.innerHTML = `❌ <strong>False Positive:</strong> Patient does not have ${diag}`;
            diagUl.appendChild(li);
            falseCount++;
        }
    });

    // Find missed diagnoses
    const allPossibleStudentTargets = new Set();
    Object.values(PATHOLOGY_OPTIONS).flat().forEach(v => allPossibleStudentTargets.add(DIAGNOSIS_TO_SERVER_WARNING[v] || v));
    
    mappedServerWarnings.forEach(sw => {
        if (!allPossibleStudentTargets.has(sw)) return; // Don't dock points for backend risks the UI doesn't allow parsing yet
        
        let studentFoundIt = Array.from(studentDiagnoses).some(sd => (DIAGNOSIS_TO_SERVER_WARNING[sd]||sd) === sw);
        
        if (!studentFoundIt) {
            const li = document.createElement('li');
            li.innerHTML = `⚠️ <strong>Missed Diagnosis:</strong> You failed to flag ${sw}`;
            diagUl.appendChild(li);
            missedCount++;
        }
    });

    if (correctCount === 0 && falseCount === 0 && missedCount === 0) {
       diagUl.innerHTML = '<li>Healthy patient. No severe risks.</li>';
    } else if (correctCount > 0 && falseCount === 0 && missedCount === 0) {
        document.getElementById('eval-score').innerText = "Diagnostic Status: Perfect";
        document.getElementById('eval-score').style.color = "var(--accent-green)";
    } else {
        document.getElementById('eval-score').innerText = "Diagnostic Status: Requires Review";
        document.getElementById('eval-score').style.color = "var(--danger)";
    }

}

// Custom Multi-Select Logic (No Ctrl/Cmd Needed)
document.getElementById('flag-select').addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'OPTION') {
        e.preventDefault();
        const originalScrollTop = this.scrollTop;
        e.target.selected = !e.target.selected;
        
        // Mutually exclusive flags
        if (e.target.selected) {
            if (e.target.value === 'pediatric') {
                const geriatricOpt = Array.from(this.options).find(opt => opt.value === 'geriatric');
                if (geriatricOpt) geriatricOpt.selected = false;
            } else if (e.target.value === 'geriatric') {
                const pediatricOpt = Array.from(this.options).find(opt => opt.value === 'pediatric');
                if (pediatricOpt) pediatricOpt.selected = false;
            }
        }
        
        this.focus();
        setTimeout(() => { this.scrollTop = originalScrollTop; }, 0);
    }
});

// Event Listeners
btnGenerate.addEventListener('click', generatePatient);
if(btnSubmitPlan) btnSubmitPlan.addEventListener('click', evaluateDiet);
document.getElementById('btn-new-patient').addEventListener('click', () => {
    document.getElementById('generation-modal').classList.remove('hidden');
});

// Initialize empty blocks UI on load
renderBlocks();
