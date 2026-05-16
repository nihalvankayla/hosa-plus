export const topNavLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Study', path: '/study' },
  { label: 'Testing', path: '/testing' },
  { label: 'Planner', path: '/planner' },
  { label: 'Analytics', path: '/analytics' },
]

export const dashboardStats = [
  {
    label: 'Days to States',
    value: '40',
    detail: 'May 11, 2026',
    tone: 'navy',
  },
  {
    label: 'Comp Readiness',
    value: '74%',
    detail: '+6% this week',
    tone: 'green',
  },
  {
    label: 'Day Streak',
    value: '7',
    detail: 'Perfect week',
    tone: 'maroon',
  },
  {
    label: 'Weakest Area',
    value: '38%',
    detail: 'Pharmacology',
    tone: 'amber',
  },
]

export const flashcardDecks = [
  {
    name: 'Pharmacology',
    cards: [
      {
        question: 'What is the difference between an agonist and an antagonist?',
        answer:
          'An agonist activates a receptor to create a response. An antagonist blocks a receptor and prevents a response.',
      },
      {
        question: 'What does drug half-life describe?',
        answer:
          'Half-life is the time it takes for the amount of a drug in the body to decrease by half.',
      },
    ],
  },
  {
    name: 'EMT Skills',
    cards: [
      {
        question: 'What is the first step in patient assessment?',
        answer:
          'Confirm scene safety before approaching the patient or beginning care.',
      },
      {
        question: 'Why should a responder check responsiveness early?',
        answer:
          'Responsiveness helps determine urgency, airway risk, and the next steps in assessment.',
      },
    ],
  },
]

export const quizQuestions = [
  {
    question: 'A resting adult heart rate above 100 bpm is called:',
    options: ['Bradycardia', 'Tachycardia', 'Hypotension', 'Apnea'],
    answer: 'Tachycardia',
    explanation:
      'Tachycardia means a resting heart rate above 100 beats per minute in an adult.',
  },
  {
    question: 'Which action should come first during emergency assessment?',
    options: ['Apply a splint', 'Check scene safety', 'Give water', 'Call family'],
    answer: 'Check scene safety',
    explanation:
      'Scene safety protects the responder, patient, and bystanders before care begins.',
  },
]

export const plannerTasks = [
  { title: 'Review pharmacology flashcards', tag: 'Study', done: false },
  { title: 'Run one timed EMT skills station', tag: 'Skills', done: true },
  { title: 'Update presentation references', tag: 'Project', done: false },
]

export const readinessAreas = [
  { name: 'Pharm', score: 38, status: 'critical' },
  { name: 'EMT', score: 45, status: 'critical' },
  { name: 'A&P', score: 78, status: 'healthy' },
  { name: 'Terminology', score: 82, status: 'healthy' },
  { name: 'Math', score: 64, status: 'warn' },
  { name: 'Ethics', score: 72, status: 'healthy' },
]
