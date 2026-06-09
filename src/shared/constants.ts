import type { ExtensionSettings, FreelancerProfile } from './types';

export const DEFAULT_FREELANCER_PROFILE: FreelancerProfile = {
  yearsOfExperience: 8,
  platformProfileNote:
    'Embora meu perfil na plataforma seja recente, atuo há mais de 8 anos com desenvolvimento de sistemas e aplicações web.',
  acceptedTechnologies: [
    'JavaScript',
    'TypeScript',
    'React',
    'React.js',
    'Vue',
    'Vue.js',
    'Next.js',
    'Node.js',
    'PHP',
    'Python',
    'WordPress',
    'MySQL',
    'PostgreSQL',
  ],
  rejectedTechnologies: [
    'Java',
    'Spring',
    'Spring Boot',
    'AWS',
    'Microsoft Azure',
    'Azure',
    'Google Cloud Platform',
    'GCP',
    'Kubernetes',
  ],
  acceptedProjectTypes: [
    'sites institucionais',
    'landing pages',
    'sites pessoais',
    'sites educacionais',
    'sites para advogados',
    'correção de bugs',
    'manutenção',
    'APIs',
    'dashboards',
  ],
  rejectedProjectTypes: [
    'e-commerce completo',
    'marketplace completo',
    'aplicativo móvel complexo',
    'devops avançado',
  ],
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  mode: 'manual',
  apiBaseUrl: '',
  apiToken: '',
  valorMinimoAceitavel: 150,
  minPriceDiscountPercent: 35,
  maxPriceDiscountPercent: 50,
  minDeadlineDays: 1,
  maxComplexity: 'high',
  proposalMinChars: 700,
  proposalMaxChars: 1500,
  useEmojis: false,
  waitTimeoutMs: 15000,
  freelancerProfile: DEFAULT_FREELANCER_PROFILE,
};

export const STATE_MESSAGES: Record<string, string> = {
  IDLE: 'Aguardando formulário de proposta...',
  DETECTING_PAGE: 'Detectando página do 99Freelas...',
  WAITING_FOR_FORM: 'Aguardando formulário de proposta...',
  EXTRACTING_PROJECT: 'Lendo informações do projeto...',
  ANALYZING_ELIGIBILITY: 'Verificando compatibilidade...',
  CALCULATING_PRICE: 'Calculando preço competitivo...',
  CALCULATING_DEADLINE: 'Calculando prazo competitivo...',
  GENERATING_PROPOSAL: 'Elaborando proposta personalizada...',
  VALIDATING_RESPONSE: 'Validando proposta gerada...',
  FILLING_FORM: 'Preenchendo formulário...',
  COMPLETED: 'Proposta preenchida com sucesso. Revise os dados antes de enviar.',
  REJECTED: 'Projeto não recomendado para o seu perfil.',
  REVIEW_REQUIRED: 'Revisão manual necessária antes de preencher.',
  ERROR: 'Ocorreu um erro durante o processamento.',
};

export const INJECTION_PATTERNS = [
  /ignore\s+(suas\s+)?regras/i,
  /revele\s+(suas\s+)?instru/i,
  /informe\s+sua\s+chave/i,
  /clique\s+automaticamente/i,
  /envie\s+uma\s+proposta\s+com/i,
  /system\s*prompt/i,
  /jailbreak/i,
];

export const REJECTED_TECH_PATTERNS: Array<{ pattern: RegExp; label: string; wordBoundary?: boolean }> = [
  { pattern: /\bjava\b(?![\w.-]*script)/i, label: 'Java', wordBoundary: true },
  { pattern: /\bspring(\s+boot)?\b/i, label: 'Spring/Spring Boot' },
  { pattern: /\baws\b/i, label: 'AWS' },
  { pattern: /\b(microsoft\s+)?azure\b/i, label: 'Microsoft Azure' },
  { pattern: /\bgcp\b|\bgoogle\s+cloud\b/i, label: 'Google Cloud Platform' },
  { pattern: /\bkubernetes\b/i, label: 'Kubernetes' },
];

export const ACCEPTED_TECH_PATTERNS = [
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\breact(\.js)?\b/i,
  /\bvue(\.js)?\b/i,
  /\bnext\.js\b/i,
  /\bnode\.js\b/i,
  /\bphp\b/i,
  /\bpython\b/i,
  /\bwordpress\b/i,
  /\bmysql\b/i,
  /\bpostgresql\b/i,
];

export const REACT_NATIVE_COMPLEX_PATTERNS = [
  /\bapp\s+completo\b/i,
  /\bdo\s+zero\b/i,
  /\bautentica/i,
  /\bpagamento/i,
  /\bgeolocal/i,
  /\bpublica(r|ção)\s+(na\s+)?(loja|store)/i,
  /\bmódulos?\b/i,
];

export const REACT_NATIVE_SIMPLE_PATTERNS = [
  /\bcorre(ç|c)(ã|a)o\b/i,
  /\bajuste\s+(visual|de\s+layout)\b/i,
  /\bbug\b/i,
  /\bcomponente\b/i,
  /\btexto\b/i,
  /\bapi\b/i,
  /\bmanuten(ç|c)(ã|a)o\b/i,
];

export const ECOM_FULL_PATTERNS = [
  /\be-?commerce\s+completo\b/i,
  /\bloja\s+virtual\s+completa\b/i,
  /\bmarketplace\s+completo\b/i,
  /\bplataforma\s+de\s+e-?commerce\b/i,
];

export const STORAGE_KEYS = {
  settings: 'extensionSettings',
  lastResult: 'lastAgentResult',
  lastStatus: 'lastAgentStatus',
} as const;
