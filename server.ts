import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { DEFAULT_DOCUMENTS } from "./src/data/defaultDocuments";
import {
  HRDocument,
  QueryResponse,
  SourceCitation,
  User,
  UserRole,
  StoredQuestion,
  CommonQuestionsDashboardData,
  DocumentCategory
} from "./src/types";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// DATA_DIR is overridable so the JSON store can live outside the deploy
// directory. On Elastic Beanstalk each deploy replaces /var/app/current,
// so pointing this at a path outside that tree keeps data across deploys.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const DOCS_FILE = path.join(DATA_DIR, "documents.json");
const QUESTIONS_FILE = path.join(DATA_DIR, "questions_history.json");

const DEFAULT_STORED_QUESTIONS: StoredQuestion[] = [
  {
    id: "q-hist-1",
    question: "How many PTO days can I roll over to next year?",
    category: "Time Off",
    askCount: 46,
    firstAskedAt: "2026-07-12T10:15:00.000Z",
    lastAskedAt: "2026-09-03T11:45:00.000Z",
    primaryDocument: "Paid Time Off (PTO) & Leave Policy 2026",
    primarySection: "Section 4.1: PTO Accrual, Carryover & Forfeiture",
    documentId: "doc-pto-leave",
    foundInDocs: true,
    answerSummary: "Employees may roll over a maximum of 5 unused PTO days (40 hours) into the next calendar year. Carried-over days must be used by June 30 or they will expire.",
    departmentTag: "All Departments"
  },
  {
    id: "q-hist-2",
    question: "What is our 401(k) company match formula and vesting schedule?",
    category: "Benefits",
    askCount: 38,
    firstAskedAt: "2026-07-15T14:20:00.000Z",
    lastAskedAt: "2026-09-02T16:10:00.000Z",
    primaryDocument: "401(k) Retirement & Financial Wellness Plan",
    primarySection: "Section 2.1: Employer Matching Formula",
    documentId: "doc-401k-policy",
    foundInDocs: true,
    answerSummary: "Acme provides a 100% match on the first 4% contributed plus 50% on the next 2% (up to 5% total company contribution) with 100% immediate vesting.",
    departmentTag: "Engineering & Operations"
  },
  {
    id: "q-hist-3",
    question: "Can I work remotely from another state or abroad?",
    category: "General Policies",
    askCount: 31,
    firstAskedAt: "2026-07-20T09:30:00.000Z",
    lastAskedAt: "2026-09-03T08:15:00.000Z",
    primaryDocument: "Remote Work & Travel Guidelines",
    primarySection: "Section 3.1: Temporary Relocation & Cross-Border Remote Work",
    documentId: "doc-remote-work",
    foundInDocs: true,
    answerSummary: "Domestic remote work allowed up to 30 cumulative business days per year. International remote work is capped at 14 consecutive calendar days with 15 days advance written notice.",
    departmentTag: "Product & Engineering"
  },
  {
    id: "q-hist-4",
    question: "How many free mental health therapy sessions do we get?",
    category: "Benefits",
    askCount: 27,
    firstAskedAt: "2026-07-25T11:00:00.000Z",
    lastAskedAt: "2026-09-01T15:25:00.000Z",
    primaryDocument: "Employee Health & Comprehensive Benefits Guide",
    primarySection: "Section 4.1: Mental Wellness & Lyra Health Benefit",
    documentId: "doc-benefits-guide",
    foundInDocs: true,
    answerSummary: "Through Lyra Health, all full-time employees and covered dependents receive 10 confidential, 100% company-paid therapy or coaching sessions per calendar year.",
    departmentTag: "All Departments"
  },
  {
    id: "q-hist-5",
    question: "How much is the annual education stipend and what are the clawback terms?",
    category: "Career & Learning",
    askCount: 22,
    firstAskedAt: "2026-08-02T13:40:00.000Z",
    lastAskedAt: "2026-08-30T10:05:00.000Z",
    primaryDocument: "Professional Development & Education Reimbursement Policy",
    primarySection: "Section 1.1: Annual Learning Budget & Eligible Programs",
    documentId: "doc-learning-growth",
    foundInDocs: true,
    answerSummary: "Annual budget of $1,500 after 90 days tenure. If an employee completes a course/certification exceeding $1,000 and leaves within 6 months, 50% must be repaid.",
    departmentTag: "Marketing & Sales"
  },
  {
    id: "q-hist-6",
    question: "What is the paid parental leave duration for new parents?",
    category: "Time Off",
    askCount: 19,
    firstAskedAt: "2026-08-05T16:00:00.000Z",
    lastAskedAt: "2026-09-02T09:40:00.000Z",
    primaryDocument: "Paid Time Off (PTO) & Leave Policy 2026",
    primarySection: "Section 4.4: Paid Parental Leave",
    documentId: "doc-pto-leave",
    foundInDocs: true,
    answerSummary: "Primary caregivers receive up to 16 consecutive weeks of 100% paid salary continuation; secondary caregivers receive up to 8 consecutive weeks of 100% paid leave.",
    departmentTag: "All Departments"
  },
  {
    id: "q-hist-7",
    question: "What is the daily meal per diem when traveling for business?",
    category: "Expenses",
    askCount: 15,
    firstAskedAt: "2026-08-10T12:15:00.000Z",
    lastAskedAt: "2026-08-29T17:30:00.000Z",
    primaryDocument: "Business Travel & Expense Reimbursement Guidelines",
    primarySection: "Section 2.2: Meal Allowances & Daily Per Diem Rates",
    documentId: "doc-expenses-policy",
    foundInDocs: true,
    answerSummary: "Standard daily meal per diem is $75/day ($15 breakfast, $25 lunch, $35 dinner). High-cost metropolitan areas (NYC, SF, London) allow up to $100/day with itemized receipts.",
    departmentTag: "Sales & Customer Success"
  },
  {
    id: "q-hist-8",
    question: "Does Acme reimburse monthly gym memberships or fitness apps?",
    category: "Benefits",
    askCount: 14,
    firstAskedAt: "2026-08-14T08:50:00.000Z",
    lastAskedAt: "2026-09-01T11:20:00.000Z",
    primaryDocument: "Employee Health & Comprehensive Benefits Guide",
    primarySection: "Section 4.2: Wellness & Fitness Reimbursement",
    documentId: "doc-benefits-guide",
    foundInDocs: true,
    answerSummary: "Employees are eligible for a $50/month ($600/year) fitness reimbursement for gym memberships, yoga studios, or mindfulness apps submitted via Expensify.",
    departmentTag: "Engineering & People"
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: "user-admin-1",
    name: "Morgan Vance",
    email: "admin@company.internal",
    role: "admin",
    title: "VP of People Operations",
    department: "Human Resources",
    avatar: "MV",
    createdAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "user-employee-1",
    name: "Alex Rivera",
    email: "alex.rivera@company.internal",
    role: "employee",
    title: "Senior Fullstack Engineer",
    department: "Engineering",
    avatar: "AR",
    createdAt: "2026-02-01T10:30:00.000Z",
  },
  {
    id: "user-employee-2",
    name: "Taylor Kim",
    email: "taylor.kim@company.internal",
    role: "employee",
    title: "Product Marketing Specialist",
    department: "Marketing",
    avatar: "TK",
    createdAt: "2026-02-15T14:15:00.000Z",
  },
];

function loadUsers(): User[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
    return DEFAULT_USERS;
  } catch (err) {
    console.error("Failed to load users from file, using defaults:", err);
    return DEFAULT_USERS;
  }
}

function saveUsers(userList: User[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(userList, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save users to file:", err);
  }
}

function loadDocuments(): HRDocument[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DOCS_FILE)) {
      const data = fs.readFileSync(DOCS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(DOCS_FILE, JSON.stringify(DEFAULT_DOCUMENTS, null, 2), "utf-8");
    return JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS));
  } catch (err) {
    console.error("Failed to load documents from file, using defaults:", err);
    return JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS));
  }
}

function saveDocuments(docs: HRDocument[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save documents to file:", err);
  }
}

function loadQuestionsHistory(): StoredQuestion[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(QUESTIONS_FILE)) {
      const data = fs.readFileSync(QUESTIONS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(DEFAULT_STORED_QUESTIONS, null, 2), "utf-8");
    return JSON.parse(JSON.stringify(DEFAULT_STORED_QUESTIONS));
  } catch (err) {
    console.error("Failed to load questions history from file, using defaults:", err);
    return JSON.parse(JSON.stringify(DEFAULT_STORED_QUESTIONS));
  }
}

function saveQuestionsHistory(questions: StoredQuestion[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save questions history to file:", err);
  }
}

function recordQuestionInHistory(
  query: QueryResponse,
  category?: DocumentCategory | string,
  user?: User | null
): void {
  try {
    const list = loadQuestionsHistory();
    const cleanQ = query.question.trim();
    const cleanLower = cleanQ.toLowerCase();

    // Check if an existing question matches (exact or high substring match)
    const existingIndex = list.findIndex(
      (item) =>
        item.question.toLowerCase() === cleanLower ||
        (cleanLower.length > 15 && item.question.toLowerCase().includes(cleanLower)) ||
        (cleanLower.length > 15 && cleanLower.includes(item.question.toLowerCase()))
    );

    const primarySrc = query.sources && query.sources.length > 0 ? query.sources[0] : null;
    const docTitle = primarySrc ? primarySrc.documentTitle : "General HR Policy Guidance";
    const secTitle = primarySrc ? primarySrc.section : "General Question";
    const matchedDocId = primarySrc?.documentId;

    // Detect category if not explicitly provided or is 'All'
    let finalCategory: DocumentCategory = (category && category !== "All" ? category : "General Policies") as DocumentCategory;
    if (finalCategory === "General Policies") {
      if (cleanLower.includes("pto") || cleanLower.includes("vacation") || cleanLower.includes("rollover") || cleanLower.includes("leave") || cleanLower.includes("parental") || cleanLower.includes("maternity") || cleanLower.includes("holiday")) {
        finalCategory = "Time Off";
      } else if (cleanLower.includes("401") || cleanLower.includes("retire") || cleanLower.includes("vest") || cleanLower.includes("health") || cleanLower.includes("dental") || cleanLower.includes("vision") || cleanLower.includes("therapy") || cleanLower.includes("lyra") || cleanLower.includes("gym") || cleanLower.includes("wellness")) {
        finalCategory = "Benefits";
      } else if (cleanLower.includes("expense") || cleanLower.includes("travel") || cleanLower.includes("per diem") || cleanLower.includes("meal") || cleanLower.includes("hotel") || cleanLower.includes("receipt") || cleanLower.includes("expensify")) {
        finalCategory = "Expenses";
      } else if (cleanLower.includes("learn") || cleanLower.includes("education") || cleanLower.includes("tuition") || cleanLower.includes("course") || cleanLower.includes("conference") || cleanLower.includes("stipend") || cleanLower.includes("clawback")) {
        finalCategory = "Career & Learning";
      }
    }

    const answerSnippet = query.answer.replace(/[#*`_]/g, "").slice(0, 160).trim() + "...";

    if (existingIndex >= 0) {
      list[existingIndex].askCount += 1;
      list[existingIndex].lastAskedAt = new Date().toISOString();
      list[existingIndex].foundInDocs = query.foundInDocs;
      if (primarySrc) {
        list[existingIndex].primaryDocument = docTitle;
        list[existingIndex].primarySection = secTitle;
        if (matchedDocId) list[existingIndex].documentId = matchedDocId;
      }
      if (answerSnippet) {
        list[existingIndex].answerSummary = answerSnippet;
      }
      if (user?.department) {
        list[existingIndex].departmentTag = user.department;
      }
    } else {
      const newEntry: StoredQuestion = {
        id: `q-hist-${Date.now()}`,
        question: cleanQ,
        category: finalCategory,
        askCount: 1,
        firstAskedAt: new Date().toISOString(),
        lastAskedAt: new Date().toISOString(),
        primaryDocument: docTitle,
        primarySection: secTitle,
        documentId: matchedDocId,
        foundInDocs: query.foundInDocs,
        answerSummary: answerSnippet,
        departmentTag: user?.department || "General Staff",
      };
      list.unshift(newEntry);
    }

    saveQuestionsHistory(list);
  } catch (err) {
    console.error("Failed to record question in history:", err);
  }
}

// Persisted state initialized from disk
let users: User[] = loadUsers();
let documents: HRDocument[] = loadDocuments();

// Helper to identify the requesting user via x-user-id header, query, or Bearer auth
function getRequestUser(req: express.Request): User | null {
  const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const currentUsers = loadUsers();
  if (userId) {
    const found = currentUsers.find(
      (u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase()
    );
    if (found) return found;
  }
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const found = currentUsers.find(
      (u) => u.id === token || u.email.toLowerCase() === token.toLowerCase()
    );
    if (found) return found;
  }
  return null;
}

// In-memory query feedback store
const feedbackStore: Array<{ id: string; queryId: string; helpful: boolean; reason?: string; timestamp: string }> = [];

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Fallback search & citation generator for testing/offline resilience
function generateFallbackAnswer(question: string, docs: HRDocument[]): QueryResponse {
  const qLower = question.toLowerCase();
  
  // Specific policy rule mapping for authentic midsize company HR questions
  if (qLower.includes('rollover') || (qLower.includes('pto') && qLower.includes('carry')) || (qLower.includes('pto') && qLower.includes('roll'))) {
    const ptoDoc = docs.find((d) => d.id === 'doc-pto-leave') || docs[0];
    const rolloverSec = ptoDoc.sections.find((s) => s.id === 'pto-rollover') || ptoDoc.sections[1];
    return {
      id: `ans-${Date.now()}`,
      question,
      answer: `Under Acme's **Paid Time Off (PTO) & Leave Policy**, you can roll over a maximum of **5 unused PTO days (40 hours)** into the next calendar year.\n\n### Key Rollover Guidelines:\n- **Rollover Cap:** Maximum 5 days (40 hours) carry over automatically.\n- **Expiration Deadline:** Carried-over days must be used by **June 30** of the following year, or they will expire.\n- **Excess Forfeiture:** Any unused accrued balance beyond 5 days as of 11:59 PM on December 31 is forfeited without cash payout.\n- **Emergency Exceptions:** An extension requires advance written approval from an Executive VP prior to December 1st.`,
      sources: [
        {
          documentId: ptoDoc.id,
          documentTitle: ptoDoc.title,
          section: rolloverSec.title,
          excerpt: 'A maximum of 5 unused PTO days (40 hours) may be carried over from one calendar year to the next. Any accrued balance beyond 5 days that remains unused by 11:59 PM on December 31 will expire...',
          pageOrLocation: ptoDoc.fileName,
          relevance: 'Defines the 5-day rollover maximum and expiration deadlines.'
        }
      ],
      suggestedFollowUps: [
        'How many PTO days do I accrue each year?',
        'How do dedicated sick days differ from PTO?',
        'What is the parental leave duration?'
      ],
      actionableInfo: {
        label: 'Check PTO Balance in Workday',
        type: 'portal',
        target: 'https://workday.company.internal/time-off',
        note: 'Submit requests at least 2 weeks in advance.'
      },
      foundInDocs: true,
      confidence: 'high',
      timestamp: new Date().toISOString()
    };
  }

  if (qLower.includes('401') || qLower.includes('retirement') || qLower.includes('match') || qLower.includes('vesting')) {
    const retDoc = docs.find((d) => d.id === 'doc-401k-policy') || docs[0];
    const matchSec = retDoc.sections.find((s) => s.id === '401k-match') || retDoc.sections[0];
    const vestSec = retDoc.sections.find((s) => s.id === '401k-vesting') || retDoc.sections[1];
    return {
      id: `ans-${Date.now()}`,
      question,
      answer: `Acme provides a **Fidelity 401(k)** plan with an employer match of up to **5% of your eligible compensation** and **immediate 100% vesting**.\n\n### Match Formula:\n- **100% match** on the first **4%** of your salary contributed.\n- **50% match** on the next **2%** of your salary contributed.\n- **Total Benefit:** If you contribute 6%, Acme contributes 5%, giving you an **11% total retirement investment**.\n\n### Vesting & Enrollment:\n- **100% Immediate Vesting:** All employer matching dollars belong to you immediately with no vesting cliff.\n- **Auto-Enrollment:** New employees are automatically enrolled at 4% after 30 days unless changed.`,
      sources: [
        {
          documentId: retDoc.id,
          documentTitle: retDoc.title,
          section: matchSec.title,
          excerpt: 'Company Match Formula: 100% dollar-for-dollar match on the first 4% of the employee eligible compensation, plus 50% match on the next 2%...',
          pageOrLocation: retDoc.fileName,
          relevance: 'Specifies the exact matching tiers and total company contribution.'
        },
        {
          documentId: retDoc.id,
          documentTitle: retDoc.title,
          section: vestSec.title,
          excerpt: 'Vesting Schedule: 100% Immediate Vesting. All employer matching contributions belong to the employee immediately upon deposit with zero multi-year vesting cliff.',
          pageOrLocation: retDoc.fileName,
          relevance: 'Verifies 100% day-one vesting schedule.'
        }
      ],
      suggestedFollowUps: [
        'How do I change my 401(k) contribution percentage?',
        'Does Acme offer Roth 401(k) contributions?',
        'How do I schedule a free Fidelity financial advisor session?'
      ],
      actionableInfo: {
        label: 'Manage Contributions in Fidelity NetBenefits',
        type: 'portal',
        target: 'https://fidelity.com/acme',
        note: 'Log in with SSO to adjust deferral rates.'
      },
      foundInDocs: true,
      confidence: 'high',
      timestamp: new Date().toISOString()
    };
  }

  if (qLower.includes('remote') || qLower.includes('country') || qLower.includes('state') || qLower.includes('abroad')) {
    const remDoc = docs.find((d) => d.id === 'doc-remote-work') || docs[0];
    const travelSec = remDoc.sections.find((s) => s.id === 'remote-travel') || remDoc.sections[2];
    return {
      id: `ans-${Date.now()}`,
      question,
      answer: `Yes, Acme allows temporary remote work outside your home location, subject to explicit duration limits:\n\n### Working From Another US State (Domestic):\n- Allowed up to **30 cumulative business days** per calendar year.\n- Requires direct manager notification and adherence to corporate security protocols.\n\n### Working Internationally (Abroad):\n- Capped at **14 consecutive calendar days** per trip (maximum 21 days total per year).\n- Requires **prior written approval from People Operations at least 15 days in advance** to comply with cross-border tax, payroll nexus, and data sovereignty laws.`,
      sources: [
        {
          documentId: remDoc.id,
          documentTitle: remDoc.title,
          section: travelSec.title,
          excerpt: 'Domestic: Employees may work remotely from another US state for up to thirty (30) cumulative business days... International: strictly capped at fourteen (14) consecutive calendar days per trip...',
          pageOrLocation: remDoc.fileName,
          relevance: 'Sets legal limits on domestic and international remote work duration.'
        }
      ],
      suggestedFollowUps: [
        'What are Acme core collaboration hours?',
        'What home office equipment stipends are available?',
        'How do I submit an international remote work request?'
      ],
      actionableInfo: {
        label: 'Submit Remote Travel Request to People Ops',
        type: 'email',
        target: 'people-ops@company.internal',
        note: 'Requires 15 days advance notice for international work.'
      },
      foundInDocs: true,
      confidence: 'high',
      timestamp: new Date().toISOString()
    };
  }

  if (qLower.includes('therapy') || qLower.includes('mental') || qLower.includes('lyra') || qLower.includes('wellness') || qLower.includes('gym')) {
    const benDoc = docs.find((d) => d.id === 'doc-benefits-guide') || docs[0];
    const mentalSec = benDoc.sections.find((s) => s.id === 'benefits-mental-wellness') || benDoc.sections[3];
    return {
      id: `ans-${Date.now()}`,
      question,
      answer: `Acme provides two dedicated wellness and mental health benefits:\n\n### Mental Health Support (Lyra Health):\n- **10 free sessions** of confidential therapy or coaching per calendar year for you and each covered dependent.\n- 100% paid by the company, with no copay or deductible required.\n- Access is available 24/7 online at **lyra.acmecorp.com** or by calling **1-800-555-LYRA**.\n\n### Wellness & Fitness Subsidy:\n- **$50 per month ($600/year)** reimbursement for gym memberships, fitness classes (yoga, pilates), or mindfulness apps (e.g., Headspace, Calm).\n- Submit monthly receipts in Expensify under category "Wellness Subsidy".`,
      sources: [
        {
          documentId: benDoc.id,
          documentTitle: benDoc.title,
          section: mentalSec.title,
          excerpt: 'Through Lyra Health, all employees and their dependents receive ten (10) confidential, 100% free therapy or mental health coaching sessions per calendar year... Wellness & Fitness Stipend: $50 per month...',
          pageOrLocation: benDoc.fileName,
          relevance: 'Details Lyra Health 10-session benefit and the $50/mo gym stipend.'
        }
      ],
      suggestedFollowUps: [
        'Can my dependents use the Lyra therapy sessions?',
        'How do I submit the $50 monthly gym reimbursement?',
        'What are the medical plan deductibles?'
      ],
      actionableInfo: {
        label: 'Book Session with Lyra Health',
        type: 'portal',
        target: 'https://lyra.acmecorp.com',
        note: 'Confidential 24/7 hotline: 1-800-555-LYRA'
      },
      foundInDocs: true,
      confidence: 'high',
      timestamp: new Date().toISOString()
    };
  }

  if (qLower.includes('education') || qLower.includes('tuition') || qLower.includes('stipend') || qLower.includes('course') || qLower.includes('conference') || qLower.includes('clawback')) {
    const learnDoc = docs.find((d) => d.id === 'doc-learning-growth') || docs[0];
    const budSec = learnDoc.sections[0];
    const retSec = learnDoc.sections[1];
    return {
      id: `ans-${Date.now()}`,
      question,
      answer: `Acme offers an annual **Professional Development Budget of $1,500** per employee per calendar year.\n\n### Eligibility & Covered Expenses:\n- Eligible after **90 days of tenure**.\n- Covers industry conferences, professional certifications (e.g. AWS, PMP, SHRM), accredited online courses (Coursera, Reforge), and relevant technical books.\n\n### Approval & Retention Policy:\n- **Pre-Approval Required:** Submit a Jira Service Desk request approved by your direct manager *before* purchasing.\n- **Clawback Clause:** For courses or certifications exceeding **$1,000**, if you voluntarily resign within **6 months** of completion, **50% of the reimbursed cost** must be repaid via payroll deduction.`,
      sources: [
        {
          documentId: learnDoc.id,
          documentTitle: learnDoc.title,
          section: budSec.title,
          excerpt: 'Each regular full-time employee who has completed at least 90 days of tenure is allocated an annual Professional Development budget of $1,500 per calendar year...',
          pageOrLocation: learnDoc.fileName,
          relevance: 'Details the $1,500 annual budget and covered categories.'
        },
        {
          documentId: learnDoc.id,
          documentTitle: learnDoc.title,
          section: retSec.title,
          excerpt: 'Retention / Clawback Terms: For individual courses, degrees, or certifications exceeding $1,000 funded by the company, if the employee voluntarily resigns within six (6) months... 50% must be repaid...',
          pageOrLocation: learnDoc.fileName,
          relevance: 'Explains the 6-month 50% retention clawback condition.'
        }
      ],
      suggestedFollowUps: [
        'Does the education budget roll over if unused?',
        'Can I expense books without manager approval?',
        'How do I submit the expense report in Expensify?'
      ],
      actionableInfo: {
        label: 'Submit Learning Request Ticket',
        type: 'portal',
        target: 'https://jira.company.internal/servicedesk/learning',
        note: 'Manager approval required prior to incurring expenses.'
      },
      foundInDocs: true,
      confidence: 'high',
      timestamp: new Date().toISOString()
    };
  }

  if (qLower.includes('parental') || qLower.includes('maternity') || qLower.includes('paternity') || qLower.includes('baby')) {
    const ptoDoc = docs.find((d) => d.id === 'doc-pto-leave') || docs[0];
    const parentSec = ptoDoc.sections.find((s) => s.id === 'pto-parental-leave') || ptoDoc.sections[3];
    return {
      id: `ans-${Date.now()}`,
      question,
      answer: `Acme provides fully paid parental leave for new parents following birth, adoption, or foster placement:\n\n### Leave Duration (100% Paid):\n- **Primary Caregivers:** Up to **16 consecutive weeks** of 100% regular base salary continuation.\n- **Secondary Caregivers:** Up to **8 consecutive weeks** of 100% regular base salary continuation.\n\n### Eligibility & Flexibility:\n- Eligible after **90 days of continuous full-time employment**.\n- Can be taken continuously or in up to **two separate blocks** within the child's first 12 months.\n- Employees must submit a Parental Leave Request form to People Ops at least 30 calendar days in advance.`,
      sources: [
        {
          documentId: ptoDoc.id,
          documentTitle: ptoDoc.title,
          section: parentSec.title,
          excerpt: 'Primary Caregiver: Up to 16 consecutive weeks of 100% regular base salary continuation. Secondary Caregiver: Up to 8 consecutive weeks of 100% regular base salary continuation...',
          pageOrLocation: ptoDoc.fileName,
          relevance: 'Outlines the 16-week and 8-week 100% paid leave terms.'
        }
      ],
      suggestedFollowUps: [
        'Can parental leave be split into multiple periods?',
        'How do I request parental leave 30 days in advance?',
        'Does health insurance continue during parental leave?'
      ],
      actionableInfo: {
        label: 'Request Parental Leave Packet',
        type: 'email',
        target: 'people-ops@company.internal',
        note: 'Submit at least 30 days prior to expected date.'
      },
      foundInDocs: true,
      confidence: 'high',
      timestamp: new Date().toISOString()
    };
  }

  // General keyword search fallback
  const matchedSections: Array<{ doc: HRDocument; section: HRDocument['sections'][0]; score: number }> = [];

  for (const doc of docs) {
    for (const sec of doc.sections) {
      let score = 0;
      const titleLower = sec.title.toLowerCase();
      const contentLower = sec.content.toLowerCase();

      const keywords = qLower.split(/\W+/).filter((w) => w.length > 2);
      for (const kw of keywords) {
        if (titleLower.includes(kw)) score += 4;
        if (contentLower.includes(kw)) score += 1;
      }

      if (score > 0) {
        matchedSections.push({ doc, section: sec, score });
      }
    }
  }

  matchedSections.sort((a, b) => b.score - a.score);

  if (matchedSections.length === 0) {
    return {
      id: `ans-${Date.now()}`,
      question,
      answer: "I couldn't find a specific policy addressing your question in our current uploaded HR documents. Please check with the People Operations team directly at **people-ops@company.internal** or open an HR support ticket.",
      sources: [],
      suggestedFollowUps: [
        "How do I submit an HR support ticket?",
        "What are the standard PTO rollover rules?",
        "What health insurance plans are available?"
      ],
      actionableInfo: {
        label: "Contact People Ops",
        type: "email",
        target: "people-ops@company.internal",
        note: "Normal response time is within 1 business day."
      },
      foundInDocs: false,
      confidence: "low",
      timestamp: new Date().toISOString()
    };
  }

  const topMatch = matchedSections[0];
  const citations: SourceCitation[] = matchedSections.slice(0, 2).map((m) => ({
    documentId: m.doc.id,
    documentTitle: m.doc.title,
    section: m.section.title,
    excerpt: m.section.content.split("\n")[0] || m.section.content.slice(0, 160),
    pageOrLocation: m.doc.fileName,
    relevance: `Matched ${m.section.title}`
  }));

  const answer = `Based on **${topMatch.doc.title}** (${topMatch.section.title}):\n\n${topMatch.section.content}`;

  return {
    id: `ans-${Date.now()}`,
    question,
    answer,
    sources: citations,
    suggestedFollowUps: [
      `What other rules apply to ${topMatch.doc.title}?`,
      "How do I request an exception from HR?",
      "Who can I contact if I have further questions?"
    ],
    actionableInfo: {
      label: "View Full Policy in Workday",
      type: "portal",
      target: "https://workday.company.internal/hr-documents",
      note: "Referenced from internal HR knowledge base"
    },
    foundInDocs: true,
    confidence: "high",
    timestamp: new Date().toISOString()
  };
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Authentication & Account Persistence Endpoints
app.get("/api/auth/users", (req, res) => {
  const currentUsers = loadUsers();
  res.json({ users: currentUsers });
});

app.get("/api/auth/me", (req, res) => {
  const user = getRequestUser(req);
  if (user) {
    return res.json({ user });
  }
  // Default to the first employee if not specified
  const currentUsers = loadUsers();
  const defaultUser = currentUsers.find((u) => u.role === "employee") || currentUsers[0];
  res.json({ user: defaultUser });
});

app.post("/api/auth/login", (req, res) => {
  const { userId, email } = req.body;
  const currentUsers = loadUsers();
  const found = currentUsers.find(
    (u) => (userId && u.id === userId) || (email && u.email.toLowerCase() === email.toLowerCase())
  );
  if (!found) {
    return res.status(404).json({ error: "User account not found" });
  }
  res.json({ success: true, user: found });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, role, title, department } = req.body;
  if (!name || typeof name !== "string" || !email || typeof email !== "string") {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const currentUsers = loadUsers();
  if (currentUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: "An account with this email address already exists" });
  }

  const assignedRole: UserRole = role === "admin" ? "admin" : "employee";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: cleanEmail,
    role: assignedRole,
    title: title?.trim() || (assignedRole === "admin" ? "HR Administrator" : "Staff Member"),
    department: department?.trim() || (assignedRole === "admin" ? "People Operations" : "General"),
    avatar: initials || "U",
    createdAt: new Date().toISOString(),
  };

  currentUsers.push(newUser);
  saveUsers(currentUsers);
  users = currentUsers;

  res.status(201).json({ success: true, user: newUser });
});

app.get("/api/documents", (req, res) => {
  const currentDocs = loadDocuments();
  res.json({
    documents: currentDocs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      fileName: d.fileName,
      lastUpdated: d.lastUpdated,
      version: d.version,
      summary: d.summary,
      sectionCount: d.sections.length,
      sections: d.sections,
      content: d.content,
      isCustom: d.isCustom || false,
    })),
  });
});

app.post("/api/documents", (req, res) => {
  // Role verification: Only Admins can upload documents
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({
      error: "Authentication required: Please specify an authenticated user header or select an account.",
    });
  }

  if (user.role !== "admin") {
    return res.status(403).json({
      error: `Access Denied: You are signed in as "${user.name}" (${user.role.toUpperCase()}). Only Admins are authorized to upload or publish policy documents. Employees may only search and ask questions.`,
    });
  }

  const { title, category, fileName, summary, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  // Parse markdown headers into sections if possible
  const rawSections = content.split(/^##\s+/m);
  const sections = [];
  if (rawSections.length > 1) {
    for (let i = 1; i < rawSections.length; i++) {
      const lines = rawSections[i].trim().split("\n");
      const secTitle = lines[0].trim();
      const secContent = lines.slice(1).join("\n").trim();
      sections.push({
        id: `sec-${Date.now()}-${i}`,
        title: secTitle,
        content: secContent || lines.join("\n"),
      });
    }
  } else {
    sections.push({
      id: `sec-${Date.now()}-1`,
      title: "General Policy Details",
      content: content.trim(),
    });
  }

  const newDoc: HRDocument = {
    id: `custom-doc-${Date.now()}`,
    title: title.trim(),
    category: category || "General Policies",
    fileName: fileName || `${title.replace(/\s+/g, "_")}.md`,
    lastUpdated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    version: "v1.0 (Uploaded)",
    summary: summary || content.slice(0, 140) + "...",
    content: content.trim(),
    sections,
    isCustom: true,
  };

  documents.push(newDoc);
  saveDocuments(documents);
  res.status(201).json({ success: true, document: newDoc });
});

app.delete("/api/documents/:id", (req, res) => {
  // Role verification: Only Admins can delete documents
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({
      error: "Authentication required to delete documents.",
    });
  }

  if (user.role !== "admin") {
    return res.status(403).json({
      error: `Access Denied: User "${user.name}" has the "${user.role}" role. Only Admins can delete documents.`,
    });
  }

  const docId = req.params.id;
  const initialLength = documents.length;
  documents = documents.filter((d) => d.id !== docId);
  if (documents.length === initialLength) {
    return res.status(404).json({ error: "Document not found" });
  }
  saveDocuments(documents);
  res.json({ success: true, remainingCount: documents.length });
});

app.post("/api/documents/reset", (req, res) => {
  const user = getRequestUser(req);
  if (user && user.role !== "admin") {
    return res.status(403).json({
      error: "Access Denied: Only Admins can reset policies to defaults.",
    });
  }

  documents = JSON.parse(JSON.stringify(DEFAULT_DOCUMENTS));
  saveDocuments(documents);
  res.json({ success: true, documentsCount: documents.length });
});

// Common Questions Dashboard API Endpoints (backed by stored question history)
app.get("/api/common-questions", (req, res) => {
  const list = loadQuestionsHistory();
  const sorted = [...list].sort((a, b) => b.askCount - a.askCount);
  const totalQueries = sorted.reduce((acc, curr) => acc + (curr.askCount || 1), 0);

  // Group frequency by category
  const categoryCounts: Record<string, number> = {};
  sorted.forEach((q) => {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + (q.askCount || 1);
  });

  const categoryBreakdown = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));

  const dashboardData: CommonQuestionsDashboardData = {
    totalQueries,
    uniqueQuestionsCount: sorted.length,
    questions: sorted,
    categoryBreakdown,
    lastUpdated: new Date().toISOString(),
  };

  res.json(dashboardData);
});

app.post("/api/common-questions/reset", (req, res) => {
  const user = getRequestUser(req);
  if (user && user.role !== "admin") {
    return res.status(403).json({
      error: "Access Denied: Only HR Administrators can reset common question history.",
    });
  }

  saveQuestionsHistory(DEFAULT_STORED_QUESTIONS);
  res.json({ success: true, count: DEFAULT_STORED_QUESTIONS.length });
});

app.post("/api/query", async (req, res) => {
  try {
    const { question, filterCategory, history } = req.body;
    
    // Improved error handling: Check if question box is empty
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question. The question box cannot be empty.",
      });
    }

    const trimmedQuestion = question.trim();
    const reqUser = getRequestUser(req);

    // Improved error handling: Friendly message if no documents are uploaded yet
    if (!documents || documents.length === 0) {
      const emptyDocsResponse: QueryResponse = {
        id: `ans-no-docs-${Date.now()}`,
        question: trimmedQuestion,
        answer: "There are currently no HR policy documents uploaded to HRSage. To receive verified answers grounded in company policy, an HR Administrator must first upload handbooks or guidelines. Please contact People Operations at **people-ops@company.internal** or switch to an Administrator profile above to upload or restore documents.",
        sources: [],
        suggestedFollowUps: [
          "How can an administrator upload policy documents?",
          "Can I restore the default company HR handbook?"
        ],
        actionableInfo: {
          label: "Contact People Operations",
          type: "email",
          target: "people-ops@company.internal",
          note: "Knowledge base is waiting for initial policy documents."
        },
        foundInDocs: false,
        confidence: "low",
        timestamp: new Date().toISOString(),
      };
      recordQuestionInHistory(emptyDocsResponse, filterCategory, reqUser);
      return res.json(emptyDocsResponse);
    }

    const availableDocs = filterCategory && filterCategory !== "All"
      ? documents.filter((d) => d.category === filterCategory)
      : documents;

    // If filtered category has no documents
    if (availableDocs.length === 0) {
      const emptyCategoryResponse: QueryResponse = {
        id: `ans-no-cat-docs-${Date.now()}`,
        question: trimmedQuestion,
        answer: `No policy documents are currently uploaded under the **${filterCategory}** category. You can select "All" categories or ask an HR Administrator to upload relevant documents for this topic.`,
        sources: [],
        suggestedFollowUps: [
          "Show all available HR policies",
          "What general benefits are offered?"
        ],
        actionableInfo: null,
        foundInDocs: false,
        confidence: "low",
        timestamp: new Date().toISOString(),
      };
      recordQuestionInHistory(emptyCategoryResponse, filterCategory, reqUser);
      return res.json(emptyCategoryResponse);
    }

    const ai = getGenAI();

    // If no AI key configured, use our intelligent local search fallback
    if (!ai) {
      const fallback = generateFallbackAnswer(trimmedQuestion, availableDocs);
      recordQuestionInHistory(fallback, filterCategory, reqUser);
      return res.json(fallback);
    }

    // Build context with structured sections and document IDs
    const formattedDocsContext = availableDocs
      .map((doc, idx) => {
        const sectionsText = doc.sections
          .map((s) => `### [Section: ${s.title}]\n${s.content}`)
          .join("\n\n");
        return `=== DOCUMENT ${idx + 1}: ${doc.title} (File: ${doc.fileName}, Category: ${doc.category}) ===\nSummary: ${doc.summary}\n\n${sectionsText}`;
      })
      .join("\n\n==========================================\n\n");

    const prompt = `You are HRSage, an intelligent, empathetic, and authoritative internal HR Knowledge Assistant for midsize company employees.
Your objective: Give an exact, friendly, easy-to-read answer to the employee's HR question, strictly grounded in the uploaded HR policy documents below.

CURRENT HR DOCUMENTS:
${formattedDocsContext}

EMPLOYEE QUESTION:
"${trimmedQuestion}"

STRICT INSTRUCTIONS:
1. ONLY state facts explicitly written in the provided HR documents. Never hallucinate, guess, or borrow external corporate policies.
2. If the policy or question is NOT answered in the text, clearly indicate that it is not covered in the current company documents, explain what is known (if anything related), and provide directions to contact the HR team. Set foundInDocs = false.
3. Every factual claim must be backed by a source citation in the "sources" list with documentTitle and section.
4. Each source item must contain:
   - "documentTitle": Exact title of the document.
   - "section": Exact section name/heading.
   - "excerpt": Verbatim or close excerpt quotation from the policy text that proves the statement.
   - "relevance": Brief note explaining why this citation is relevant.
5. In your "answer", write in concise, clean markdown (use bullet points and bold numbers for readability). Address the employee directly ("You can...", "Our policy states...").
6. Provide 2-3 logical "suggestedFollowUps" that an employee would likely ask next.
7. Include "actionableInfo" if there is an explicit portal or contact action (e.g. Workday, Expensify, Fidelity NetBenefits, Lyra, or HR email).`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini generation timeout")), 8500)
    );

    const generatePromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: "The clear, direct answer formatted in markdown with bold highlights and bullet points."
            },
            foundInDocs: {
              type: Type.BOOLEAN,
              description: "True if the answer was found in the provided HR documents; false if unaddressed."
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  documentTitle: { type: Type.STRING },
                  section: { type: Type.STRING },
                  excerpt: { type: Type.STRING },
                  relevance: { type: Type.STRING }
                },
                required: ["documentTitle", "section", "excerpt"]
              },
              description: "List of exact document sections and excerpts supporting the answer."
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 or 3 natural follow up questions for the employee."
            },
            actionableInfo: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                type: { type: Type.STRING, description: "portal, email, or link" },
                target: { type: Type.STRING },
                note: { type: Type.STRING }
              },
              description: "Optional next step portal or contact information."
            },
            confidence: {
              type: Type.STRING,
              description: "Confidence level: high, medium, or low"
            }
          },
          required: ["answer", "foundInDocs", "sources", "suggestedFollowUps"]
        }
      }
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const parsedJson = JSON.parse(response.text?.trim() || "{}");

    // Match document IDs for source citations if available
    const enrichedSources = (parsedJson.sources || []).map((src: any) => {
      const matchedDoc = documents.find(
        (d) =>
          d.title.toLowerCase() === (src.documentTitle || "").toLowerCase() ||
          d.title.toLowerCase().includes((src.documentTitle || "").toLowerCase()) ||
          (src.documentTitle || "").toLowerCase().includes(d.title.toLowerCase())
      );
      return {
        ...src,
        documentId: matchedDoc?.id,
        documentTitle: matchedDoc?.title || src.documentTitle || "Company Policy",
        section: src.section || "General Guidance",
        pageOrLocation: matchedDoc?.fileName || "Policy Document",
      };
    });

    const result: QueryResponse = {
      id: `ans-${Date.now()}`,
      question: trimmedQuestion,
      answer: parsedJson.answer || "No response generated.",
      sources: enrichedSources,
      suggestedFollowUps: parsedJson.suggestedFollowUps || [],
      actionableInfo: parsedJson.actionableInfo || null,
      foundInDocs: parsedJson.foundInDocs ?? true,
      confidence: parsedJson.confidence || "high",
      timestamp: new Date().toISOString()
    };

    recordQuestionInHistory(result, filterCategory, reqUser);
    res.json(result);
  } catch (error: any) {
    console.error("Error generating answer:", error);
    // Graceful fallback to rule-based retrieval if Gemini throws an error
    const reqUser = getRequestUser(req);
    const fallback = generateFallbackAnswer(req.body.question || "", documents);
    recordQuestionInHistory(fallback, req.body.filterCategory, reqUser);
    res.json(fallback);
  }
});

app.post("/api/feedback", (req, res) => {
  const { queryId, helpful, reason } = req.body;
  feedbackStore.push({
    id: `fb-${Date.now()}`,
    queryId: queryId || `unknown-${Date.now()}`,
    helpful: Boolean(helpful),
    reason: reason || "",
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, recordedCount: feedbackStore.length });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HRSage server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
