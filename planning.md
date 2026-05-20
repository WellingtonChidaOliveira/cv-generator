# Projeto: Gerador de Currículo Personalizado com IA

> **Objetivo:** A partir de um link de vaga e do PDF do LinkedIn do usuário, gerar um currículo customizado e otimizado para aquela vaga específica, via chat interativo com LangChain.

---

## Visão Geral do Sistema

```
[URL da vaga] + [PDF LinkedIn do usuário]
              ↓
     [Playwright — scraping da vaga]
              ↓
     [Claude API — extração estruturada]
     "Quais skills, requisitos e palavras-chave esta vaga exige?"
              ↓
     [PDF Parser — extração do perfil do usuário]
     "Quais experiências, skills e formação o usuário tem?"
              ↓
     [LangChain — chat interativo]
     "Você quer destacar mais a experiência X ou Y?"
     "Tem alguma conquista específica que queira incluir?"
              ↓
     [Claude API — geração do currículo]
     Matching: vaga ↔ perfil → currículo customizado
              ↓
     [Output: DOCX] → opcional: [Conversão para PDF]
```

---

## Stack Técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Linguagem | Node.js | Preferência do projeto |
| Scraping | Playwright | Lida com JS, SPAs, LinkedIn |
| Chat interativo | LangChain.js | Memória de conversa, chains, agentes |
| Modelo de IA | Claude API (claude-sonnet) | Extração + geração de qualidade |
| PDF parsing | pdf-parse ou pdfjs-dist | Leitura do PDF do LinkedIn |
| Output DOCX | docx (npm) | Geração de Word editável |
| Output PDF | LibreOffice headless ou Puppeteer | Conversão DOCX → PDF |
| Banco (opcional) | SQLite | Salvar sessões/histórico |

---

## Estrutura de Pastas

```
/cv-generator
  /src
    /scraper        ← Playwright, extração de vagas
    /parser         ← leitura e estruturação do PDF LinkedIn
    /chain          ← LangChain: chat, memória, prompts
    /generator      ← montagem e geração do DOCX/PDF
    /templates      ← templates base de currículo em DOCX
  /data
    /uploads        ← PDFs enviados pelo usuário (temporário)
    /output         ← currículos gerados
  /prompts          ← arquivos .txt com os system prompts
  index.js          ← entry point do chat
  PLANEJAMENTO.md   ← este arquivo
```

---

## Fases do Projeto

---

### Fase 0 — Setup e Ambiente
**Meta:** projeto rodando, dependências instaladas, "hello world" de cada peça.

```bash
npm init -y
npm install playwright langchain @anthropic-ai/sdk pdf-parse docx
npx playwright install chromium
```

- [x] Testar Playwright abrindo uma URL qualquer e retornando o texto
- [x] Testar leitura de um PDF com pdf-parse
- [ ] Testar uma chamada simples à Claude API
- [x] Testar criação de um DOCX básico com a lib docx

> **Por que fazer isso antes?** Cada uma dessas peças tem pegadinhas de setup. Melhor descobrir antes de integrar tudo.

---

### Fase 1 — Scraping da Vaga
**Meta:** dado qualquer URL, extrair o conteúdo relevante da vaga.

#### Desafios por site:

| Site | Desafio | Estratégia |
|---|---|---|
| LinkedIn Jobs | Login obrigatório, anti-bot | Playwright com sessão autenticada (cookies) |
| Indeed, Infojobs | Conteúdo dinâmico | Playwright + wait for selector |
| Sites de empresas | Estrutura variável | Claude extrai do HTML bruto |
| Gupy, Greenhouse | SPAs | Playwright aguarda rede idle |

#### Fluxo do scraper:

```javascript
async function scrapeVaga(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Injetar cookies salvos se for LinkedIn
  if (url.includes('linkedin.com')) {
    await injetarSessaoLinkedIn(page);
  }
  
  await page.goto(url, { waitUntil: 'networkidle' });
  const html = await page.content();
  
  // Passa o HTML para Claude extrair o que importa
  return await extrairDadosVaga(html);
}
```

#### O que extrair da vaga (via Claude):

```javascript
// Estrutura esperada após extração
{
  titulo: "Desenvolvedor Full Stack Senior",
  empresa: "Acme Corp",
  local: "São Paulo, SP (Híbrido)",
  requisitos_obrigatorios: ["Node.js", "5 anos experiência", "inglês avançado"],
  requisitos_desejaveis: ["AWS", "Docker", "TypeScript"],
  responsabilidades: ["Desenvolver APIs REST", "Code review", ...],
  palavras_chave_ats: ["full stack", "node", "react", "api rest", ...],
  nivel: "senior",
  area: "tecnologia"
}
```

> **Nota sobre LinkedIn:** A estratégia mais confiável é o usuário fazer login no browser normal, exportar os cookies via extensão (ex: "Cookie-Editor") e você injetar no Playwright. Evita ter que lidar com o fluxo de login automatizado que o LinkedIn bloqueia agressivamente.

---

### Fase 2 — Parsing do PDF do LinkedIn
**Meta:** extrair o perfil do usuário do PDF exportado pelo LinkedIn de forma estruturada.

O PDF do LinkedIn tem estrutura previsível:
- Nome e título
- Resumo (About)
- Experiências (empresa, cargo, período, descrição)
- Formação
- Skills
- Certificações
- Idiomas

```javascript
const pdfParse = require('pdf-parse');

async function parsearPerfilLinkedIn(caminhopdf) {
  const buffer = fs.readFileSync(caminhoPath);
  const { text } = await pdfParse(buffer);
  
  // Passa o texto bruto para Claude estruturar
  return await estruturarPerfil(text);
}
```

#### Estrutura esperada do perfil:

```javascript
{
  nome: "João Silva",
  titulo_atual: "Software Engineer",
  resumo: "...",
  experiencias: [
    {
      empresa: "Empresa X",
      cargo: "Senior Developer",
      periodo: "Jan 2022 – Present",
      descricao: "...",
      skills_usadas: ["Node.js", "AWS", "PostgreSQL"]
    }
  ],
  formacao: [...],
  skills: ["JavaScript", "Python", "Docker", ...],
  certificacoes: [...],
  idiomas: [{ idioma: "Inglês", nivel: "Avançado" }]
}
```

---

### Fase 3 — Chat Interativo com LangChain
**Meta:** conversa natural que coleta informações adicionais e confirma escolhas antes de gerar.

#### Por que LangChain aqui?
- Memória de conversa (lembra o que o usuário disse antes)
- Fácil injetar contexto (vaga + perfil) no system prompt
- Suporta tools/agentes para ações como "gerar agora"

#### Fluxo da conversa:

```
Sistema carrega: perfil do usuário + dados da vaga

Bot: "Olá João! Analisei sua vaga para Desenvolvedor Full Stack 
     na Acme Corp e seu perfil. Identifiquei que você tem 8 de 
     10 requisitos obrigatórios. Antes de gerar, me conta:
     
     1. Tem alguma conquista específica do seu último emprego 
        que queira destacar?
     2. Prefere um currículo mais técnico ou com foco em 
        liderança/gestão?"

Usuário: "Quero destacar que aumentei a performance da API em 40%"

Bot: "Ótimo! Incluí isso. Mais alguma coisa ou posso gerar?"

Usuário: "Pode gerar"

Bot: "Gerando... [arquivo.docx disponível para download]"
```

#### Setup LangChain:

```javascript
import { ChatAnthropic } from "@langchain/anthropic";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

const model = new ChatAnthropic({ model: "claude-sonnet-4-20250514" });

const memory = new BufferMemory();

const chain = new ConversationChain({
  llm: model,
  memory,
  prompt: buildSystemPrompt(perfilUsuario, dadosVaga)
});

// Inicia a conversa
const resposta = await chain.call({ input: mensagemUsuario });
```

#### Comandos que o chat reconhece:
- `"gerar"` / `"pode gerar"` / `"gera o currículo"` → dispara a geração
- `"em PDF"` → gera DOCX e converte para PDF
- `"mudar [seção]"` → reabre edição de uma parte específica
- `"recomeçar"` → limpa memória e reinicia

---

### Fase 4 — Geração do Currículo
**Meta:** montar o currículo customizado com base no matching vaga ↔ perfil.

#### Lógica de customização:

```
1. Reordenar experiências: as mais relevantes para a vaga primeiro
2. Reescrever bullets: usar as palavras-chave da vaga
3. Destacar skills: as que a vaga pede aparecem primeiro
4. Resumo/objetivo: gerado especificamente para essa vaga
5. NÃO INVENTAR: apenas reorganizar e reescrever o que o usuário já tem
```

> **Regra crítica:** O modelo nunca adiciona experiências, skills ou conquistas que o usuário não mencionou. Apenas reorganiza, reformula e otimiza o que existe. Isso deve estar explícito no system prompt.

#### Sistema de templates DOCX:

Ter 2–3 templates base (clean, moderno, compacto) que o usuário escolhe no chat. O conteúdo é sempre o mesmo — só o layout muda.

```javascript
async function gerarDocx(dadosCurriculo, template = 'clean') {
  const templateFn = templates[template];
  const doc = templateFn(dadosCurriculo);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(`./data/output/${nome}_${empresa}.docx`, buffer);
}
```

#### Conversão para PDF (quando solicitado):

```javascript
// Opção 1: LibreOffice headless (mais fiel ao layout)
exec(`libreoffice --headless --convert-to pdf arquivo.docx`);

// Opção 2: Puppeteer (abre o DOCX renderizado e imprime)
// Menos recomendado por perder formatação
```

---

### Fase 5 — Testes e Avaliação
**Meta:** métricas concretas para a pós.

#### Métricas quantitativas:
- **ATS Score** — usar ferramentas como Jobscan API ou implementar um scorer simples baseado em keyword matching
- **Cobertura de requisitos** — % dos requisitos obrigatórios da vaga cobertos pelo currículo gerado
- **Tempo de geração** — do input ao DOCX pronto

#### Métricas qualitativas (para o paper):
- Avaliação por recrutadores reais (survey)
- Comparação: currículo original vs gerado (blind review)
- Análise de 3–5 casos reais documentados

#### Testes técnicos:
- Vagas de diferentes sites (LinkedIn, Indeed, Gupy, site de empresa)
- PDFs do LinkedIn em PT e EN
- Perfis com pouca vs muita experiência
- Vagas com muitos vs poucos requisitos explícitos

---

### Fase 6 — Refinamentos (pós v1)
Ideias para versão 2, não bloquear a entrega:

- [ ] Interface web simples (upload do PDF + campo de URL)
- [ ] Suporte a múltiplas vagas simultâneas (comparar fit)
- [ ] Histórico de currículos gerados por usuário
- [ ] Carta de apresentação gerada junto
- [ ] Sugestões de skills para desenvolver (gap analysis)

---

## Decisões Técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| PDF parsing | pdf-parse | Simples, sem servidor, funciona bem com PDF do LinkedIn |
| LinkedIn auth | Cookies manuais | Evita bloqueios, mais estável |
| Geração de texto | Claude API direto | Qualidade superior para geração longa |
| Orquestração do chat | LangChain.js | Memória, chains, não reinventar a roda |
| Output primário | DOCX | Editável pelo usuário após geração |
| Output secundário | PDF via LibreOffice | Fiel ao layout, sem dependência de browser |
| Modelo | claude-sonnet-4-20250514 | Balanço custo/qualidade para geração |

---

## Cronograma Sugerido

```
Semana 1  → Fase 0 + Fase 1 (setup + scraper funcionando em 3 sites)
Semana 2  → Fase 2 (parser do PDF do LinkedIn validado)
Semana 3  → Fase 3 (chat LangChain com memória e contexto)
Semana 4  → Fase 4 (geração do DOCX com template base)
Semana 5  → Fase 5 (testes, métricas, casos documentados)
Semana 6+ → Escrita do paper + refinamentos
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| LinkedIn bloqueia Playwright | Alta | Usar cookies exportados manualmente |
| PDF do LinkedIn muda formato | Média | Testar com 5+ PDFs reais antes de finalizar o parser |
| Claude alucina experiências | Média | System prompt rígido + validação pós-geração |
| Sites de vaga sem estrutura clara | Alta | Claude extrai de HTML bruto (resiliente) |
| LibreOffice não disponível no deploy | Baixa | Puppeteer como fallback para PDF |

---

## Referências Acadêmicas Relevantes

- **Resume Tailoring with LLMs** — buscar em ACL Anthology e arXiv por "resume generation", "job description matching", "CV optimization NLP"
- **ATS Optimization** — literatura sobre keyword matching em recrutamento automático
- **Information Extraction from Job Postings** — papers sobre NER em descrições de vagas
- **LinkedIn Data Extraction** — trabalhos sobre estruturação de perfis profissionais

---

## Próxima Ação Imediata

> **Validar o parser do PDF do LinkedIn antes de qualquer outra coisa.**
> Exporte seu próprio PDF do LinkedIn e rode o pdf-parse nele. Se o texto extraído for legível e estruturado, o resto do pipeline fica muito mais simples.

```bash
npm install pdf-parse
node -e "
  const pdf = require('pdf-parse');
  const fs = require('fs');
  pdf(fs.readFileSync('seu_linkedin.pdf')).then(d => console.log(d.text.slice(0, 2000)));
"
```

---

*Documento vivo — atualizar conforme o projeto evolui.*
