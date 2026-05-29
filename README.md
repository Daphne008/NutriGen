<div align="center">
  <h1> NutriGen</h1>
  <p><strong>An AI-Powered Pedagogic Tool for Personalized Dietetics Training</strong></p>
</div>

![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![PyTorch](https://img.shields.io/badge/PyTorch-GAN-EE4C2C?style=for-the-badge&logo=pytorch)
![Machine Learning](https://img.shields.io/badge/Machine%20Learning-Synthetic%20Data-orange?style=for-the-badge)

##  Overview

**NutriGen** is a web-based educational simulation platform designed for nutrition and dietetics students. Its goal is to bridge the gap between theoretical knowledge and practical clinical experience by offering a risk-free virtual environment.

Due to strict data privacy regulations (GDPR, HIPAA), students often face a "cold start" problem—lacking real-world patient records to practice crafting personalized nutrition plans. NutriGen solves this by using **Generative Adversarial Networks (GANs)** to synthesize high-fidelity, anonymized patient profiles (including medical histories, anthropometric measurements, and quality-of-life indicators) derived from real-world datasets like NHANES and USDA FoodData Central.

##  Key Features

- **Synthetic Patient Generation (GANs)**: Probabilistic models that generate highly realistic, unique patient cases, mimicking the statistical distributions of real health populations.
- **Dietary Analysis Engine**: Compare and evaluate formulated diet plans using comprehensive nutritional reference data (calories, macronutrients).
- **Automated Feedback & Scoring**: A simulation module assessing short-term nutritional impacts, adherence to clinical guidelines (WHO, DASH), and flagging physiological risks.
- **Risk-Free Learning Environment**: Allows dietetic students to make unpenalized clinical choices to learn iteratively.

##  Project Architecture

NutriGen is structured as a modular system, separating data generation, analysis processing, and user interfaces:

1. **Dataset Layer**: NHANES for demographic distributions, USDA for nutrition profiles.
2. **Generative Modeling module (`gan_prototype.py`)**: Our core PyTorch GAN architecture.
3. **Simulation Logic (`generate_reports.py`)**: Evaluates the simulated cases and student performance parameters.
4. **Data Interface & Analysis**: Tools to validate (`test_gan_distributions.py`), format and sanitize the output (`generate_custom_patient.py`).

## Getting Started

### 1. Data Generation (Python)

If you need to manually generate synthetic patient data or run the distribution tests, ensure you have Python installed and install the ML dependencies:

```bash
pip install -r requirements.txt
```
*(Primary libraries: `pandas`, `numpy`, `torch`, `scikit-learn`)*

- **Generate Data:** `python generate_custom_patient.py`
- **Run Tests:** `python test_gan_distributions.py` and `python test_indicators.py`

### 2. Web Application Setup (Next.js)

NutriGen is a fully self-contained Next.js application located in the `NutriGen/` directory.

#### Prerequisites
- Node.js & npm
- Docker (for running the local PostgreSQL database)

#### Steps to Run

1. **Start the Database**  
   From the root folder, spin up the PostgreSQL database using Docker:
   ```bash
   docker-compose up -d
   ```

2. **Install Dependencies & Setup Environment**  
   Navigate to the application folder and set up your environment variables:
   ```bash
   cd NutriGen
   npm install
   cp .env.local.example .env.local
   # Ensure .env or .env.local has the correct DATABASE_URL
   ```

3. **Initialize the Database**  
   Apply the Prisma database migrations and seed it with initial foods and users:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   node prisma/seed.js
   ```

4. **Start the Development Server**  
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

*Note: If static assets 404 or CSS disappears on Windows, you can also use `npm run demo` to build and serve production mode locally.*

### Demo Login Credentials

Created by the database seed script:
- `admin@example.com` / `Demo12345!`
- `dietitian@example.com` / `Demo12345!`
- `dietitian2@example.com` / `Demo12345!`

## Presentation Demo Script

1. Open landing page and explain the project purpose.
2. Login as `dietitian@example.com` and go to dashboard.
3. Choose a patient category and generate a report.
4. Build a diet plan with foods and show equivalence suggestions.
5. Finish plan and show evaluation screen (calories, macros, score).
6. Logout and login as `admin@example.com`.
7. Show admin tabs (users, foods dataset, equivalence rules, generated reports).

## Deployment Checklist

- **Environment Variables**: Configure `DATABASE_URL` and any authentication secrets required.
- **Database**: Run `npx prisma migrate deploy` and `node prisma/seed.js` once in the target environment.
- **Application**: Run `npm run build && npm run start` in the `NutriGen/` directory.

##  The Team

Developed as a Computer/Software Engineering Graduation Project (2025-2026 Fall/Spring) by:
- **Şevval Bersun KARAHALİL**
- **Defne Ecem EROĞLU**
- **Oğuz Görkem ER**

*Supervised by Mentors: Aytun Onay and Şadi Şehab*

---

> Disclaimer: NutriGen is designed strictly for **pedagogical purposes**. All data is synthetic and it is not intended for active clinical diagnostics in real healthcare settings.