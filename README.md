# 99Freelas IA — Extensão Chrome

Extensão Manifest V3 com agente de IA para analisar projetos do 99Freelas e preencher automaticamente o formulário de propostas.

## Funcionalidades

- Detecção da página de projeto e formulário de proposta
- Extração de título, descrição, médias de preço/prazo e orçamento
- Classificação de compatibilidade com seu perfil freelancer
- Cálculo de preço (≥ 35% abaixo da média, quando possível)
- Cálculo de prazo (abaixo da média, mínimo 1 dia)
- Geração de proposta personalizada via backend seguro (OpenAI)
- Fallback local quando a API não estiver configurada
- Preenchimento automático de valor, prazo e descrição
- Modo manual ou automático
- Notificação visual de conclusão
- **Não envia** a proposta automaticamente

## Requisitos

- Node.js 20+
- Google Chrome
- Backend com chave OpenAI (opcional, mas recomendado)

## Instalação da extensão

```bash
npm install
npm run build
```

No Chrome:

1. Abra `chrome://extensions`
2. Ative **Modo do desenvolvedor**
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `dist`

## Configuração

1. Clique com o botão direito no ícone da extensão → **Opções**
2. Defina:
   - Modo manual ou automático
   - URL da API (ex.: `http://localhost:8787`)
   - Token (se configurado no backend)
   - Valor mínimo aceitável e percentuais de desconto

## Backend

```bash
cd backend
cp .env.example .env
# preencha OPENAI_API_KEY
npm install
npm run dev
```

Endpoint principal:

- `POST /generate-proposal`

Alternativa Supabase Edge Function:

- `backend/supabase/functions/generate-proposal/index.ts`

## Uso

1. Faça login no 99Freelas
2. Abra um projeto
3. Clique em **Enviar proposta**
4. No modo manual, clique em **Analisar e preencher proposta**
5. Revise os campos preenchidos
6. Envie manualmente

## Testes

```bash
npm test
```

## Segurança

- A chave OpenAI fica apenas no backend
- Conteúdo do projeto é tratado como dado não confiável
- A extensão não armazena credenciais do 99Freelas
- O envio final permanece sob controle do usuário

## Estrutura

```text
src/
  background/      service worker e cliente de API
  content/         detecção, extração e preenchimento
  domain/          regras de negócio
  popup/           painel rápido
  options/         configurações
  shared/          tipos, schemas e utilitários
backend/           API Node.js / Supabase Edge Function
tests/             testes unitários
```
