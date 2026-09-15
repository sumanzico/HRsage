export type DocumentCategory = 
  | 'Benefits' 
  | 'Time Off' 
  | 'General Policies' 
  | 'Expenses' 
  | 'Career & Learning';

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
}

export interface HRDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  lastUpdated: string;
  version: string;
  summary: string;
  content: string;
  sections: DocumentSection[];
  isCustom?: boolean;
}

export interface SourceCitation {
  documentId?: string;
  documentTitle: string;
  section: string;
  excerpt: string;
  pageOrLocation?: string;
  relevance?: string;
}

export interface ActionableInfo {
  label: string;
  type: 'link' | 'email' | 'portal';
  target: string;
  note?: string;
}

export interface QueryResponse {
  id: string;
  question: string;
  answer: string;
  sources: SourceCitation[];
  suggestedFollowUps: string[];
  actionableInfo?: ActionableInfo | null;
  foundInDocs: boolean;
  confidence?: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface QueryHistoryItem {
  id: string;
  question: string;
  answer: string;
  sources: SourceCitation[];
  suggestedFollowUps: string[];
  actionableInfo?: ActionableInfo | null;
  timestamp: string;
  helpfulFeedback?: boolean | null;
}

export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  department?: string;
  avatar?: string;
  createdAt: string;
}

export interface StoredQuestion {
  id: string;
  question: string;
  category: DocumentCategory;
  askCount: number;
  firstAskedAt: string;
  lastAskedAt: string;
  answerSummary: string;
  primaryDocument: string;
  primarySection: string;
  documentId?: string;
  foundInDocs: boolean;
  departmentTag?: string;
}

export interface CommonQuestionsDashboardData {
  totalQueries: number;
  uniqueQuestionsCount: number;
  questions: StoredQuestion[];
  categoryBreakdown: { category: string; count: number }[];
  lastUpdated: string;
}
