const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function inferCategory(desc) {
  const d = desc.toLowerCase();
  if (/beef|chicken|pork|turkey|lamb|fish|salmon|tuna|shrimp|meat|bacon|sausage|steak/i.test(d)) return "Protein";
  if (/milk|cheese|yogurt|butter|cream|whey/i.test(d)) return "Dairy";
  if (/apple|banana|orange|grape|berry|melon|fruit|peach|pear|plum|cherry/i.test(d)) return "Fruit";
  if (/broccoli|carrot|spinach|lettuce|onion|garlic|tomato|potato|vegetable|pepper|celery|salad|corn|pea/i.test(d)) return "Vegetable";
  if (/rice|bread|pasta|noodle|oat|cereal|wheat|grain|flour|bun|crust/i.test(d)) return "Grain";
  if (/bean|lentil|chickpea|soy|tofu|edamame/i.test(d)) return "Legume";
  if (/nut|almond|peanut|walnut|seed|pecan|cashew/i.test(d)) return "Nuts/Seeds";
  if (/oil|fat|dressing|mayo|margarine/i.test(d)) return "Fat/Oil";
  if (/sugar|candy|syrup|chocolate|cookie|cake|pie|pastry|muffin|brownie|dessert|ice cream/i.test(d)) return "Sweet";
  if (/water|juice|soda|coffee|tea|beverage|drink|beer|wine|liquor/i.test(d)) return "Beverage";
  return "General";
}

async function run() {
  console.log("Clearing database...");
  await prisma.dietPlanItem.deleteMany();
  await prisma.dietPlan.deleteMany();
  await prisma.patientReport.deleteMany();
  await prisma.foodEquivalence.deleteMany();
  await prisma.food.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("Demo12345!", 10);
  await prisma.user.create({
    data: { name: "Demo Dietitian", email: "dietitian@example.com", passwordHash, role: "DIETITIAN" }
  });

  console.log("Reading foods_clean.json...");
  const foodsPath = path.join(__dirname, '..', '..', 'foods_clean.json');
  const rawData = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

  console.log(`Seeding ${rawData.length} foods...`);
  const foodData = rawData.map(item => ({
    id: item.id,
    name: item.description,
    category: inferCategory(item.description),
    calories: item.calories,
    protein: item.protein_g,
    carbs: item.carbs_g,
    fat: item.fat_g,
    portionGram: 100
  }));

  // Chunk inserts for Prisma
  const chunkSize = 500;
  for (let i = 0; i < foodData.length; i += chunkSize) {
    const chunk = foodData.slice(i, i + chunkSize);
    await prisma.food.createMany({ data: chunk });
    console.log(`Inserted ${Math.min(i + chunkSize, foodData.length)} foods...`);
  }

  console.log("Seed completed!");
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
