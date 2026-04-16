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

##  Getting Started

### Prerequisites

Ensure you have Python installed, then install the dependencies via:

```bash
pip install -r requirements.txt
```

*(Primary libraries: `pandas`, `numpy`, `torch`, `scikit-learn`)*

### Generating Patient Data

You can use the existing pretrained GAN model(s) to synthesize data.

```bash
python generate_custom_patient.py
```

### Running Tests

To validate the distributions and bounds of the generated patient records, execute:

```bash
python test_gan_distributions.py
python test_indicators.py
```

##  The Team

Developed as a Computer/Software Engineering Graduation Project (2025-2026 Fall/Spring) by:
- **Şevval Bersun KARAHALİL**
- **Defne Ecem EROĞLU**
- **Oğuz Görkem ER**

*Supervised by Mentors: Aytun Onay and Şadi Şehab*

---

> Disclaimer: NutriGen is designed strictly for **pedagogical purposes**. All data is synthetic and it is not intended for active clinical diagnostics in real healthcare settings.
