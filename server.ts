import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
(globalThis as any).__dirname = path.resolve(__dirname, 'node_modules/vite-plugin-pwa/dist');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: Generate scenario-based AZ-900 quiz question(s)
app.post('/api/generate-scenario', async (req, res) => {
  try {
    const {
      pathId,
      moduleId,
      difficulty = 'Intermediate',
      customPrompt = '',
      count = 1,
      weakModules = [],
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const systemInstruction = `You are the AZ-900 Smart Quiz Builder & Knowledge Assistant, an elite Microsoft Certified Trainer for the AZ-900 Microsoft Azure Fundamentals exam.
Your task is to write authentic, scenario-based practice questions that strictly mirror Microsoft Learn's real AZ-900 exam format.

Question requirements:
1. Scenario-based: Real enterprise/business scenario (e.g., e-commerce migrating workloads, financial compliance, hybrid network setup, cost optimization).
2. Exactly 4 distinct choices: A, B, C, D. All choices must be real Azure concepts or services.
3. Instant Feedback Engine:
   - "correctAnswer": Exact letter ("A", "B", "C", or "D").
   - "correctAnswerText": The exact text of the correct option.
   - "whyCorrect": Clear 2-3 sentence explanation of the Azure concept and why it satisfies the scenario constraints.
   - "whyIncorrect": A mapped explanation object with entries for each distractor letter explaining in 1 clear sentence why that choice is incorrect or doesn't meet requirements.
   - "examTip": A punchy, memorable keyword or shortcut rule for quick memory retention during the exam (e.g. "Whenever the exam mentions...", "Remember: LRS = 3 copies in single datacenter...").
4. Metadata:
   - "learningPathId": 1, 2, or 3.
   - "learningPathTitle": Official Path title.
   - "moduleId": 1 to 12.
   - "moduleTitle": Official Module title.
   - "difficulty": "Fundamental", "Intermediate", or "Advanced".`;

    const weakModulesText =
      Array.isArray(weakModules) && weakModules.length > 0
        ? `\nTargeted Weak Modules from User's Recent Quiz Session (distribute questions across these lowest-scoring modules):\n` +
          weakModules
            .map(
              (wm: any) =>
                `- Module ${wm.moduleId}: ${wm.moduleTitle} (Path ${wm.pathId}: ${wm.pathTitle}, Current Score: ${wm.accuracy}%)`
            )
            .join('\n')
        : '';

    const promptText = `Generate ${count} scenario-based AZ-900 exam question(s).
Focus:
- Learning Path: ${pathId ? `Path ${pathId}` : 'Official AZ-900 paths'}
- Module: ${moduleId ? `Module ${moduleId}` : 'Targeted weak modules listed below'}
- Target Difficulty: ${difficulty}
${customPrompt ? `- Specific Scenario/Topic focus: "${customPrompt}"` : ''}${weakModulesText}

Ensure distractors are plausible real Azure services that test genuine conceptual understanding.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Unique slug ID' },
              learningPathId: { type: Type.INTEGER },
              learningPathTitle: { type: Type.STRING },
              moduleId: { type: Type.INTEGER },
              moduleTitle: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              scenario: { type: Type.STRING, description: 'The scenario context and problem' },
              question: { type: Type.STRING, description: 'The specific question being asked' },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    letter: { type: Type.STRING, description: 'A, B, C, or D' },
                    text: { type: Type.STRING, description: 'Option text' },
                  },
                  required: ['letter', 'text'],
                },
              },
              correctAnswer: { type: Type.STRING, description: 'Letter A, B, C, or D' },
              whyCorrect: { type: Type.STRING, description: 'Why this option is correct' },
              distractorBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    letter: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['letter', 'reason'],
                },
              },
              examTip: { type: Type.STRING, description: 'Key memory tip / rule' },
            },
            required: [
              'scenario',
              'question',
              'options',
              'correctAnswer',
              'whyCorrect',
              'distractorBreakdown',
              'examTip',
            ],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ questions: parsed });
  } catch (error: any) {
    console.error('Error generating scenario:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate question with AI',
    });
  }
});

// API: AZ-900 Knowledge Assistant interactive tutor chat
app.post('/api/ask-assistant', async (req, res) => {
  try {
    const { query, history = [], currentContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const systemInstruction = `You are the AZ-900 Knowledge Assistant, a warm, authoritative, and encouraging Microsoft Certified Azure tutor with deep expertise in the AZ-900 curriculum.
Your visual and pedagogical identity blends high-tech Microsoft Azure precision with warm African hospitality, wisdom, and clarity.

Curriculum Structure:
- Learning Path 1: Cloud Concepts (Cloud Models, Shared Responsibility, Cloud Benefits, CapEx vs OpEx, Consumption)
- Learning Path 2: Azure Architecture & Services (Regions, Availability Zones, Resource Groups, Compute VMs/App Service/Containers/AKS, Networking VNets/Gateways/ExpressRoute, Storage Tiers & Redundancy LRS/ZRS/GRS, Entra ID, RBAC, Zero Trust)
- Learning Path 3: Azure Management & Governance (Cost Management & Pricing Calculator, Policy & Initiatives, Locks, ARM/Bicep/Cloud Shell/Arc, Advisor/Monitor/Service Health)

Guidelines:
1. Provide razor-sharp, exam-focused answers. Keep concepts intuitive with relatable real-world analogies.
2. When comparing concepts (e.g. ExpressRoute vs VPN Gateway, Azure Policy vs RBAC, Blob Hot vs Cool vs Archive), provide clear side-by-side differentiation.
3. Always include an "💡 Exam Anchor Tip" summarizing the exact keyword trigger Microsoft uses on the exam.
4. If relevant, propose a mini 1-question scenario check to test the learner's immediate understanding.
5. Use clean markdown formatting with bold terms, bullet points, and code/quote blocks where appropriate.`;

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }],
      })),
      {
        role: 'user',
        parts: [
          {
            text: `${currentContext ? `[Context: Current Study Module: ${currentContext}]\n` : ''}${query}`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      answer: response.text || 'I could not generate an answer at this moment.',
    });
  } catch (error: any) {
    console.error('Error in Knowledge Assistant:', error);
    res.status(500).json({
      error: error.message || 'Failed to process inquiry with Knowledge Assistant',
    });
  }
});

// Mount Vite or static server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });

    // Provide clean /@vite/client module with inert transport for AI Studio cloud environment
    app.get('/@vite/client', async (req, res, next) => {
      try {
        const mod = await vite.transformRequest('/@vite/client');
        if (mod) {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-cache');
          let code = mod.code;
          if (code.includes('const createWebSocketModuleRunnerTransport = (options) => {')) {
            code = code.replace(
              'const createWebSocketModuleRunnerTransport = (options) => {',
              'const createWebSocketModuleRunnerTransport = () => ({ async connect() {}, send() {}, async disconnect() {} }); const _unused_ws = (options) => {'
            );
          }
          return res.send(code);
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AZ-900 Quiz Builder server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
