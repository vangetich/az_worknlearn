export interface SwahiliProverb {
  id: string;
  swahili: string;
  englishTranslation: string;
  studyTheme: string;
  examMeaning: string;
  habitAction: string;
  culturalContext: string;
  accent: {
    gradient: string;
    badgeBg: string;
    badgeText: string;
    border: string;
  };
}

export const SWAHILI_STUDY_PROVERBS: SwahiliProverb[] = [
  {
    id: 'proverb-1',
    swahili: 'Kidogo kidogo hujaza kibaba.',
    englishTranslation: 'Little by little fills the container.',
    studyTheme: 'Consistent Daily Practice',
    examMeaning:
      'You do not need to memorize all 12 Azure modules in one marathon weekend. Solving 5 to 10 questions every day builds deep, enduring architectural intuition that stays with you on exam day.',
    habitAction:
      'Aim for your daily goal of 10 questions today. Consistent streaks beat last-minute cramming every time.',
    culturalContext:
      'A classic East African agricultural proverb teaching that small, steady contributions compound into abundant granaries.',
    accent: {
      gradient: 'from-amber-600 to-orange-600',
      badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
      badgeText: 'text-amber-800',
      border: 'border-amber-400',
    },
  },
  {
    id: 'proverb-2',
    swahili: 'Elimu ni bahari haina mwisho.',
    englishTranslation: 'Education is an ocean without end.',
    studyTheme: 'Lifelong Cloud Craftsmanship',
    examMeaning:
      'Microsoft Azure evolves monthly with new capabilities. View AZ-900 not as a box to check, but as your foundational anchor to navigate the vast sea of cloud computing.',
    habitAction:
      'Investigate why incorrect distractors fail instead of just memorizing the right choice. True understanding outlasts the exam.',
    culturalContext:
      'Coastal Swahili maritime wisdom reminding scholars that knowledge expands infinitely the deeper one sails.',
    accent: {
      gradient: 'from-blue-600 to-cyan-600',
      badgeBg: 'bg-blue-100 text-blue-950 border-blue-300',
      badgeText: 'text-blue-800',
      border: 'border-blue-400',
    },
  },
  {
    id: 'proverb-3',
    swahili: 'Kupotea njia ndio kujua njia.',
    englishTranslation: 'To lose the path is how one truly learns the way.',
    studyTheme: 'Growth Through Mistakes',
    examMeaning:
      'Every missed question reveals an exact conceptual boundary—such as mistaking Azure Policy for RBAC. Mistakes in practice are gifts that prevent costly errors on the real exam.',
    habitAction:
      'When you miss a question, click "Re-Test" or review the Diagnostic Trap Breakdown before moving to the next item.',
    culturalContext:
      'Caravan traveler proverb recognizing that an explorer who gets lost discovers landmarks that maps never show.',
    accent: {
      gradient: 'from-rose-600 to-amber-600',
      badgeBg: 'bg-rose-100 text-rose-950 border-rose-300',
      badgeText: 'text-rose-800',
      border: 'border-rose-400',
    },
  },
  {
    id: 'proverb-4',
    swahili: 'Mchovya asali hachovi mara moja.',
    englishTranslation: 'He who dips his finger into honey does not dip only once.',
    studyTheme: 'Flow State & Joy in Learning',
    examMeaning:
      'Once you achieve that "aha!" breakthrough understanding of tricky cloud trade-offs (like CapEx vs OpEx or Availability Zones), your curiosity and study momentum naturally take flight.',
    habitAction:
      'Celebrate each milestone badge or streak milestone; let that positive momentum carry you straight into the next module.',
    culturalContext:
      'Traditional celebration of the sweet reward of honest effort and wholesome curiosity.',
    accent: {
      gradient: 'from-yellow-600 to-amber-600',
      badgeBg: 'bg-yellow-100 text-yellow-950 border-yellow-300',
      badgeText: 'text-yellow-800',
      border: 'border-yellow-400',
    },
  },
  {
    id: 'proverb-5',
    swahili: 'Subira huvuta heri.',
    englishTranslation: 'Patience attracts blessing and prosperity.',
    studyTheme: 'Calm Exam Composure',
    examMeaning:
      'Exam day anxiety fades when you read scenarios patiently. Microsoft test questions often contain subtle anchor words like "minimize administrative overhead" or "guarantee 99.99% uptime".',
    habitAction:
      'Take 3 deep breaths before answering each multi-sentence scenario. Never rush through the prompt before identifying the core constraint.',
    culturalContext:
      'Core Swahili ethical virtue highlighting that deliberate care yields lasting prosperity and peace of mind.',
    accent: {
      gradient: 'from-emerald-600 to-teal-600',
      badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      badgeText: 'text-emerald-800',
      border: 'border-emerald-400',
    },
  },
  {
    id: 'proverb-6',
    swahili: 'Aisifuye mvua imemnyea.',
    englishTranslation: 'He who praises the rain has felt it fall upon him.',
    studyTheme: 'Hands-On Practice Over Passive Reading',
    examMeaning:
      'You can read documentation for hours, but active problem-solving in practice questions is what cements real architecture knowledge. Real mastery comes from testing yourself.',
    habitAction:
      'Pair every theoretical reading session with at least 5 active scenario drills to test your recall under realistic conditions.',
    culturalContext:
      'Agricultural proverb affirming that true appreciation and comprehension comes from genuine firsthand experience.',
    accent: {
      gradient: 'from-indigo-600 to-blue-600',
      badgeBg: 'bg-indigo-100 text-indigo-950 border-indigo-300',
      badgeText: 'text-indigo-800',
      border: 'border-indigo-400',
    },
  },
  {
    id: 'proverb-7',
    swahili: 'Haba na haba, hujaza kibaba.',
    englishTranslation: 'Grain by grain, the measure is filled.',
    studyTheme: 'Compound Knowledge Accumulation',
    examMeaning:
      'Every technical term you master—from Azure Arc to ExpressRoute to SLAs—adds another brick to your 700+ passing score foundation. No study minute is ever wasted.',
    habitAction:
      'Use the Quick Study drawer on each module to verify the top 5 frequently missed keywords before tackling questions.',
    culturalContext:
      'Traditional grain measure proverb emphasizing that even tiny single grains aggregate into nourishing community harvests.',
    accent: {
      gradient: 'from-orange-600 to-amber-700',
      badgeBg: 'bg-orange-100 text-orange-950 border-orange-300',
      badgeText: 'text-orange-800',
      border: 'border-orange-400',
    },
  },
  {
    id: 'proverb-8',
    swahili: 'Bidii hufungua milango ya fursa.',
    englishTranslation: 'Diligence unlocks the doors of opportunity.',
    studyTheme: 'Global Impact & Career Elevation',
    examMeaning:
      'Attaining your Microsoft Azure certification is recognized worldwide, empowering engineers across Kenya, Africa, and the global cloud ecosystem to build and lead scalable cloud solutions.',
    habitAction:
      'Commit to completing your practice plan this week. Share questions with peers in the study room to sharpen each other like iron.',
    culturalContext:
      'Community Harambee ethos: collective uplift and diligent individual effort forge resilient futures for everyone.',
    accent: {
      gradient: 'from-purple-600 to-pink-600',
      badgeBg: 'bg-purple-100 text-purple-950 border-purple-300',
      badgeText: 'text-purple-800',
      border: 'border-purple-400',
    },
  },
];
