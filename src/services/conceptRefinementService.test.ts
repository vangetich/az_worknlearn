import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  refineConceptWithAi,
  formatRefinementMarkdown,
  ConceptRefinementResult,
} from './conceptRefinementService';
import {
  getStoredStreakCelebrationsEnabled,
  applyStreakCelebrationsEnabled,
  initStreakCelebrationsEnabled,
  STREAK_CELEBRATION_EFFECTS_STORAGE_KEY,
  STREAK_CELEBRATION_EFFECTS_CHANGED_EVENT,
} from '../utils/highContrast';

// Polyfill window & localStorage for tests
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = val;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

const listeners: Record<string, ((e: any) => void)[]> = {};
const mockDocumentElement = {
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
};

const mockWindow = {
  addEventListener: (type: string, cb: any) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(cb);
  },
  removeEventListener: (type: string, cb: any) => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter((fn) => fn !== cb);
    }
  },
  dispatchEvent: (e: any) => {
    const list = listeners[e.type] || [];
    list.forEach((cb) => cb(e));
    return true;
  },
};

class MockCustomEvent {
  type: string;
  detail: any;
  constructor(type: string, opts?: { detail?: any }) {
    this.type = type;
    this.detail = opts?.detail;
  }
}

beforeAll(() => {
  (globalThis as any).window = mockWindow;
  (globalThis as any).localStorage = mockLocalStorage;
  (globalThis as any).CustomEvent = MockCustomEvent;
  (globalThis as any).document = {
    documentElement: mockDocumentElement,
  };
});

describe('Concept Refinement Service', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  it('provides a high-fidelity curated domain fallback when server is unreachable or offline', async () => {
    // Force fetch to fail
    (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await refineConceptWithAi({
      question: 'Which cloud deployment model combines on-premises and public cloud?',
      correctAnswer: 'C',
      correctAnswerText: 'Hybrid Cloud',
      whyCorrect: 'Hybrid Cloud connects private on-premises datacenters with public cloud services.',
      learningPathId: 1,
      learningPathTitle: 'Cloud Concepts',
      moduleId: 1,
      moduleTitle: 'Cloud Models',
      difficulty: 'Fundamental',
    });

    expect(result).toBeDefined();
    expect(result.moduleId).toBe(1);
    expect(result.moduleTitle).toBe('Cloud Models');
    expect(result.analogyTitle).toContain('Public Transit vs. Personal Car');
    expect(result.simplerAnalogy).toContain('Public Cloud is like taking the high-speed commuter train');
    expect(result.realWorldMapping).toContain('bank');
    expect(result.businessValue).toBeDefined();
    expect(result.examMemoryAnchor).toContain('Hybrid');
    expect(result.isAiGenerated).toBe(false);
  });

  it('maps correctly when server returns a valid AI generation response', async () => {
    const mockAiResponse = {
      refinement: {
        conceptName: 'Azure Blob Storage Access Tiers',
        analogyTitle: 'Attic vs. Wardrobe vs. Deep Storage Vault',
        simplerAnalogy:
          'Hot tier is your coat closet by the front door. Cool tier is the garage storage. Cold is the attic. Archive is the underground safety deposit box across town.',
        analogyCoreTakeaway: 'The colder the tier, the cheaper the storage per GB, but the higher and slower the retrieval cost.',
        realWorldRole: 'Lead Cloud Architect',
        realWorldMapping:
          'Medical imaging platform stores immediate 30-day scans in Hot tier, moves 1-year history to Cool/Cold, and archives 7-year regulatory compliance logs in Archive tier.',
        businessValue: '75% reduction in cloud storage expenditure while meeting HIPAA compliance.',
        examMemoryAnchor: 'Archive = rehydration takes hours; Hot = lowest access cost, highest storage cost.',
      },
    };

    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAiResponse,
    });

    const result = await refineConceptWithAi({
      question: 'Which Azure storage tier is best for long-term audit archives?',
      correctAnswer: 'D',
      correctAnswerText: 'Archive Tier',
      whyCorrect: 'Archive tier has the lowest storage cost but highest retrieval costs and takes hours to rehydrate.',
      learningPathId: 2,
      learningPathTitle: 'Azure Architecture and Services',
      moduleId: 6,
      moduleTitle: 'Storage Services',
      difficulty: 'Intermediate',
    });

    expect(result.isAiGenerated).toBe(true);
    expect(result.conceptName).toBe('Azure Blob Storage Access Tiers');
    expect(result.analogyTitle).toBe('Attic vs. Wardrobe vs. Deep Storage Vault');
    expect(result.simplerAnalogy).toContain('Hot tier is your coat closet');
    expect(result.businessValue).toContain('75% reduction');
  });

  it('formats refinement results into clean, copyable markdown', () => {
    const sampleResult: ConceptRefinementResult = {
      conceptName: 'Azure Policy vs. Role-Based Access Control',
      analogyTitle: 'Building Codes vs. Security Keycards',
      simplerAnalogy:
        'RBAC decides WHO can enter the building. Azure Policy decides WHAT can be built inside the building, regardless of who holds the key.',
      analogyCoreTakeaway: 'RBAC governs user identity permissions; Policy enforces resource compliance.',
      realWorldRole: 'Enterprise Security Architect',
      realWorldMapping:
        'Even if an administrator has Owner permissions on a subscription, Azure Policy blocks them from spinning up VMs outside the East US region.',
      businessValue: 'Guarantees 100% regional data sovereignty compliance automatically.',
      examMemoryAnchor: 'RBAC = Who can act; Azure Policy = What resources can exist.',
      isAiGenerated: true,
      moduleId: 8,
      moduleTitle: 'Azure Governance and Compliance',
    };

    const markdown = formatRefinementMarkdown(sampleResult);
    expect(markdown).toContain('### 💡 AZ-900 Concept Refinement: Azure Policy vs. Role-Based Access Control');
    expect(markdown).toContain('#### 🚊 Simpler Analogy: Building Codes vs. Security Keycards');
    expect(markdown).toContain('#### 🏢 Real-World Enterprise Mapping (Enterprise Security Architect)');
    expect(markdown).toContain('> ⚡ **AZ-900 Exam Memory Anchor:**');
  });
});

describe('Streak Celebration Effects Toggle Accessibility', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockDocumentElement.setAttribute.mockClear();
  });

  it('defaults to true when no preference is stored', () => {
    expect(getStoredStreakCelebrationsEnabled()).toBe(true);
  });

  it('can be disabled to reduce cognitive load during long study sessions', () => {
    let capturedEventDetail: any = null;
    const handler = (e: any) => {
      capturedEventDetail = e.detail;
    };
    mockWindow.addEventListener(STREAK_CELEBRATION_EFFECTS_CHANGED_EVENT, handler);

    applyStreakCelebrationsEnabled(false);

    expect(getStoredStreakCelebrationsEnabled()).toBe(false);
    expect(mockLocalStorage.getItem(STREAK_CELEBRATION_EFFECTS_STORAGE_KEY)).toBe('false');
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-streak-celebrations', 'false');
    expect(capturedEventDetail).toEqual({ enabled: false });

    mockWindow.removeEventListener(STREAK_CELEBRATION_EFFECTS_CHANGED_EVENT, handler);
  });

  it('can be re-enabled', () => {
    applyStreakCelebrationsEnabled(false);
    expect(getStoredStreakCelebrationsEnabled()).toBe(false);

    applyStreakCelebrationsEnabled(true);
    expect(getStoredStreakCelebrationsEnabled()).toBe(true);
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-streak-celebrations', 'true');
  });

  it('initializes document attribute correctly from stored state', () => {
    mockLocalStorage.setItem(STREAK_CELEBRATION_EFFECTS_STORAGE_KEY, 'false');
    initStreakCelebrationsEnabled();
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-streak-celebrations', 'false');
  });
});
