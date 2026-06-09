const PROJECT_URL_PATTERNS = [
  /99freelas\.com\.br\/project\//i,
  /99freelas\.com\.br\/projeto\//i,
  /99freelas\.com\.br\/freelancer\/project\//i,
];

export function is99FreelasHost(): boolean {
  return /99freelas\.com\.br/i.test(window.location.hostname);
}

export function isProjectPage(): boolean {
  return PROJECT_URL_PATTERNS.some((pattern) => pattern.test(window.location.href));
}

export function isLoggedIn(): boolean {
  const logoutHints = [
    'a[href*="logout"]',
    'a[href*="sair"]',
    '[data-testid*="logout"]',
  ];

  if (logoutHints.some((selector) => document.querySelector(selector))) {
    return true;
  }

  const loginHints = document.querySelector('a[href*="login"], a[href*="entrar"]');
  return !loginHints;
}

export function isExtensionContextValid(): boolean {
  return is99FreelasHost() && isLoggedIn();
}

export function pageKind(): 'project' | 'unknown' {
  if (isProjectPage()) return 'project';
  return 'unknown';
}
