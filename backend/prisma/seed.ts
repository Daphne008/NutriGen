import { MealType, PatientCategory, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo12345!";

const foodSeeds = [
  { name: "Chicken Breast", category: "Protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, portionGram: 100 },
  { name: "Lean Beef", category: "Protein", calories: 250, protein: 26, carbs: 0, fat: 15, portionGram: 100 },
  { name: "Lentils", category: "Legume", calories: 116, protein: 9, carbs: 20, fat: 0.4, portionGram: 100 },
  { name: "Rice", category: "Grain", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, portionGram: 100 },
  { name: "Apple", category: "Fruit", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portionGram: 100 },
  { name: "Banana", category: "Fruit", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portionGram: 100 },
  { name: "Yogurt", category: "Dairy", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, portionGram: 100 },
  { name: "Egg", category: "Protein", calories: 155, protein: 13, carbs: 1.1, fat: 11, portionGram: 100 },
  { name: "Milk", category: "Dairy", calories: 42, protein: 3.4, carbs: 5, fat: 1, portionGram: 100 },
  { name: "Whole Wheat Bread", category: "Grain", calories: 247, protein: 13, carbs: 41, fat: 4.2, portionGram: 100 }
];

const reportData = {
  age: 52,
  bmi: 31.4,
  requiredCalories: 2100,
  healthRisks: ["Hyperglycemia", "Cardiovascular risk"],
  bloodGlucose: 162,
  macroTargets: {
    proteinPercent: 28,
    carbsPercent: 42,
    fatPercent: 30
  }
};

const run = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.dietPlanItem.deleteMany();
  await prisma.dietPlan.deleteMany();
  await prisma.foodEquivalence.deleteMany();
  await prisma.patientReport.deleteMany();
  await prisma.food.deleteMany();
  await prisma.user.deleteMany();

  const [adminUser, dietitianUser, guestDietitian] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Platform Admin",
        email: "admin@example.com",
        passwordHash,
        role: Role.ADMIN
      }
    }),
    prisma.user.create({
      data: {
        name: "Demo Dietitian",
        email: "dietitian@example.com",
        passwordHash,
        role: Role.DIETITIAN
      }
    }),
    prisma.user.create({
      data: {
        name: "Assistant Dietitian",
        email: "dietitian2@example.com",
        passwordHash,
        role: Role.DIETITIAN
      }
    })
  ]);

  await prisma.food.createMany({
    data: foodSeeds
  });

  const foods = await prisma.food.findMany();
  const foodByName = new Map(foods.map((food) => [food.name, food]));

  const chicken = foodByName.get("Chicken Breast");
  const beef = foodByName.get("Lean Beef");
  const apple = foodByName.get("Apple");
  const banana = foodByName.get("Banana");
  const lentils = foodByName.get("Lentils");
  const milk = foodByName.get("Milk");
  const rice = foodByName.get("Rice");
  const yogurt = foodByName.get("Yogurt");

  if (!chicken || !beef || !apple || !banana || !lentils || !milk || !rice || !yogurt) {
    throw new Error("Required seeded foods are missing.");
  }

  await prisma.foodEquivalence.createMany({
    data: [
      { foodAId: chicken.id, foodBId: beef.id, equivalentRatio: 1, group: "meat" },
      { foodAId: apple.id, foodBId: banana.id, equivalentRatio: 1, group: "fruit" },
      { foodAId: milk.id, foodBId: yogurt.id, equivalentRatio: 1.2, group: "dairy" }
    ]
  });

  const patientReport = await prisma.patientReport.create({
    data: {
      userId: dietitianUser.id,
      patientCategory: PatientCategory.DIABETIC,
      data: reportData
    }
  });

  const examplePlan = await prisma.dietPlan.create({
    data: {
      userId: dietitianUser.id,
      patientReportId: patientReport.id,
      patientCategory: PatientCategory.DIABETIC,
      requiredCalories: reportData.requiredCalories,
      totalCalories: 2060,
      totalProtein: 121,
      totalCarbs: 206,
      totalFat: 68,
      score: 91
    }
  });

  await prisma.dietPlanItem.createMany({
    data: [
      { dietPlanId: examplePlan.id, foodId: yogurt.id, mealType: MealType.BREAKFAST, portionMultiplier: 1.5 },
      { dietPlanId: examplePlan.id, foodId: apple.id, mealType: MealType.BREAKFAST, portionMultiplier: 1 },
      { dietPlanId: examplePlan.id, foodId: chicken.id, mealType: MealType.LUNCH, portionMultiplier: 1.8 },
      { dietPlanId: examplePlan.id, foodId: rice.id, mealType: MealType.LUNCH, portionMultiplier: 1.7 },
      { dietPlanId: examplePlan.id, foodId: lentils.id, mealType: MealType.DINNER, portionMultiplier: 1.6 },
      { dietPlanId: examplePlan.id, foodId: milk.id, mealType: MealType.SNACK, portionMultiplier: 1.2 }
    ]
  });

  // eslint-disable-next-line no-console
  console.log("Seed completed:");
  // eslint-disable-next-line no-console
  console.log(`- Admin: ${adminUser.email}`);
  // eslint-disable-next-line no-console
  console.log(`- Dietitian: ${dietitianUser.email}`);
  // eslint-disable-next-line no-console
  console.log(`- Additional dietitian: ${guestDietitian.email}`);
  // eslint-disable-next-line no-console
  console.log(`- Shared demo password: ${DEMO_PASSWORD}`);
};

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
