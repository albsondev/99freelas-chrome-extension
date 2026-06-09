import { z } from 'zod';

export const ProjectClassificationSchema = z.enum(['HIGH_FIT', 'MEDIUM_FIT', 'LOW_FIT', 'REJECTED']);
export const ProjectComplexitySchema = z.enum(['low', 'medium', 'high']);
export const ProjectTypeSchema = z.enum([
  'bug_fix',
  'maintenance',
  'landing_page',
  'institutional_site',
  'dashboard',
  'api_integration',
  'refactoring',
  'other',
]);

export const AdditionalAnswerSchema = z.object({
  label: z.string(),
  answer: z.string(),
});

export const AgentProposalResponseSchema = z.object({
  eligible: z.boolean(),
  classification: ProjectClassificationSchema,
  confidence: z.number().min(0).max(1),
  detectedTechnologies: z.array(z.string()),
  projectType: ProjectTypeSchema,
  complexity: ProjectComplexitySchema,
  summary: z.string(),
  clientNeed: z.string(),
  proposedPrice: z.number().nullable(),
  averagePrice: z.number().nullable(),
  priceDiscountPercentage: z.number().nullable(),
  proposedDeadlineDays: z.number().int().nullable(),
  averageDeadlineDays: z.number().nullable(),
  deadlineReductionPercentage: z.number().nullable(),
  proposalText: z.string().nullable(),
  additionalAnswers: z.array(AdditionalAnswerSchema),
  warnings: z.array(z.string()),
  rejectionReasons: z.array(z.string()),
});

export type AgentProposalResponseParsed = z.infer<typeof AgentProposalResponseSchema>;

export function parseAgentResponse(raw: unknown): AgentProposalResponseParsed {
  return AgentProposalResponseSchema.parse(raw);
}

export function safeParseAgentResponse(raw: unknown) {
  return AgentProposalResponseSchema.safeParse(raw);
}
