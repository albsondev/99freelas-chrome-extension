export type AgentState =
  | 'IDLE'
  | 'DETECTING_PAGE'
  | 'WAITING_FOR_FORM'
  | 'EXTRACTING_PROJECT'
  | 'ANALYZING_ELIGIBILITY'
  | 'CALCULATING_PRICE'
  | 'CALCULATING_DEADLINE'
  | 'GENERATING_PROPOSAL'
  | 'VALIDATING_RESPONSE'
  | 'FILLING_FORM'
  | 'COMPLETED'
  | 'REJECTED'
  | 'REVIEW_REQUIRED'
  | 'ERROR';

export type ProjectClassification = 'HIGH_FIT' | 'MEDIUM_FIT' | 'LOW_FIT' | 'REJECTED';

export type ProjectComplexity = 'low' | 'medium' | 'high';

export type ProjectType =
  | 'bug_fix'
  | 'maintenance'
  | 'landing_page'
  | 'institutional_site'
  | 'dashboard'
  | 'api_integration'
  | 'refactoring'
  | 'other';

export interface ProjectData {
  url: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  technologies: string[];
  skills: string[];
  budgetMin?: number;
  budgetMax?: number;
  averageProposalPrice?: number;
  averageProposalDeadlineDays?: number;
  proposalCount?: number;
  publishedAt?: string;
  urgency?: string;
  additionalQuestions: AdditionalQuestion[];
  clientInfo?: string;
  rawText: string;
}

export interface AdditionalQuestion {
  label: string;
  fieldSelector?: string;
  required: boolean;
}

export interface FormFieldLimits {
  priceMin?: number;
  priceMax?: number;
  deadlineMin?: number;
  deadlineMax?: number;
  descriptionMaxLength?: number;
}

export interface DetectedForm {
  priceInput?: HTMLInputElement;
  deadlineInput?: HTMLInputElement;
  descriptionInput?: HTMLTextAreaElement | HTMLInputElement;
  additionalFields: Array<{ label: string; element: HTMLInputElement | HTMLTextAreaElement }>;
  limits: FormFieldLimits;
}

export interface FreelancerProfile {
  yearsOfExperience: number;
  platformProfileNote: string;
  acceptedTechnologies: string[];
  rejectedTechnologies: string[];
  acceptedProjectTypes: string[];
  rejectedProjectTypes: string[];
}

export interface ExtensionSettings {
  mode: 'automatic' | 'manual';
  apiBaseUrl: string;
  apiToken: string;
  valorMinimoAceitavel: number;
  minPriceDiscountPercent: number;
  maxPriceDiscountPercent: number;
  minDeadlineDays: number;
  maxComplexity: ProjectComplexity;
  proposalMinChars: number;
  proposalMaxChars: number;
  useEmojis: boolean;
  waitTimeoutMs: number;
  freelancerProfile: FreelancerProfile;
}

export interface AdditionalAnswer {
  label: string;
  answer: string;
}

export interface AgentProposalResponse {
  eligible: boolean;
  classification: ProjectClassification;
  confidence: number;
  detectedTechnologies: string[];
  projectType: ProjectType;
  complexity: ProjectComplexity;
  summary: string;
  clientNeed: string;
  proposedPrice: number | null;
  averagePrice: number | null;
  priceDiscountPercentage: number | null;
  proposedDeadlineDays: number | null;
  averageDeadlineDays: number | null;
  deadlineReductionPercentage: number | null;
  proposalText: string | null;
  additionalAnswers: AdditionalAnswer[];
  warnings: string[];
  rejectionReasons: string[];
}

export interface AgentRunResult {
  state: AgentState;
  project?: ProjectData;
  response?: AgentProposalResponse;
  message: string;
  filled: boolean;
}

export interface StatusUpdate {
  state: AgentState;
  message: string;
  result?: AgentRunResult;
}

export type MessageType =
  | { type: 'GET_STATUS' }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: Partial<ExtensionSettings> }
  | { type: 'GENERATE_PROPOSAL'; project: ProjectData; settings: Pick<
      ExtensionSettings,
      | 'valorMinimoAceitavel'
      | 'minPriceDiscountPercent'
      | 'maxPriceDiscountPercent'
      | 'minDeadlineDays'
      | 'proposalMinChars'
      | 'proposalMaxChars'
      | 'useEmojis'
      | 'freelancerProfile'
    > }
  | { type: 'RUN_AGENT'; force?: boolean }
  | { type: 'STATUS_UPDATE'; payload: StatusUpdate };
