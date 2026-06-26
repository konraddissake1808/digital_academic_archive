import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const categories = [
  { name: "Research Papers", slug: "research-papers", description: "Peer-reviewed academic research papers and journal articles" },
  { name: "Textbooks", slug: "textbooks", description: "Academic textbooks and course materials" },
  { name: "Lecture Notes", slug: "lecture-notes", description: "Class lecture notes and study guides" },
  { name: "Theses & Dissertations", slug: "theses-dissertations", description: "Graduate theses and doctoral dissertations" },
  { name: "Lab Reports", slug: "lab-reports", description: "Scientific laboratory reports and findings" },
  { name: "Case Studies", slug: "case-studies", description: "In-depth case study analyses" },
];

const subjects = [
  { name: "Mathematics", slug: "mathematics", description: "Pure and applied mathematics" },
  { name: "Physics", slug: "physics", description: "Classical, quantum, and applied physics" },
  { name: "Chemistry", slug: "chemistry", description: "Organic, inorganic, and physical chemistry" },
  { name: "Biology", slug: "biology", description: "Molecular biology, ecology, and life sciences" },
  { name: "Computer Science", slug: "computer-science", description: "Algorithms, systems, AI, and software engineering" },
  { name: "Economics", slug: "economics", description: "Micro and macroeconomics, econometrics" },
  { name: "History", slug: "history", description: "World history, historiography, and archives" },
  { name: "Philosophy", slug: "philosophy", description: "Logic, ethics, metaphysics, and epistemology" },
  { name: "Literature & Linguistics", slug: "literature-linguistics", description: "Literary analysis, comparative literature, and linguistics" },
  { name: "Engineering", slug: "engineering", description: "Civil, mechanical, electrical, and chemical engineering" },
  { name: "Medicine & Health Sciences", slug: "medicine-health-sciences", description: "Clinical medicine, public health, and biomedical sciences" },
  { name: "Law & Legal Studies", slug: "law-legal-studies", description: "Constitutional, international, and comparative law" },
  { name: "Psychology", slug: "psychology", description: "Cognitive, clinical, and social psychology" },
  { name: "Sociology", slug: "sociology", description: "Social theory, research methods, and social institutions" },
  { name: "Business & Management", slug: "business-management", description: "Strategy, finance, marketing, and organizational behaviour" },
  { name: "Environmental Science", slug: "environmental-science", description: "Climate, ecology, and sustainability studies" },
  { name: "Political Science", slug: "political-science", description: "Political theory, international relations, and governance" },
];

const testAccounts = [
  { email: "admin@test.com", password: "Test@1234!", fullName: "Admin User", role: "ADMIN" as const },
  { email: "publisher@test.com", password: "Test@1234!", fullName: "Publisher User", role: "PUBLISHER" as const },
  { email: "student@test.com", password: "Test@1234!", fullName: "Student User", role: "STUDENT" as const },
];

async function upsertAuthUser(email: string, password: string) {
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = users.find((u) => u.email === email);
  if (existing) return existing;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
}

async function main() {
  console.log("Seeding categories...");
  for (const category of categories) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }
  console.log(`  ✓ ${categories.length} categories`);

  console.log("Seeding subjects...");
  for (const subject of subjects) {
    await prisma.subject.upsert({ where: { slug: subject.slug }, update: {}, create: subject });
  }
  console.log(`  ✓ ${subjects.length} subjects`);

  console.log("Seeding test accounts...");
  for (const account of testAccounts) {
    const authUser = await upsertAuthUser(account.email, account.password);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { role: account.role, fullName: account.fullName },
      create: { id: authUser.id, email: account.email, fullName: account.fullName, role: account.role },
    });
    console.log(`  ✓ ${account.role.padEnd(10)} ${account.email}  (password: ${account.password})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
