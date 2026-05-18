export const flashcards = [
  {
    id: 'bh-001',
    term: 'Mental Health',
    definition: 'A state of emotional, psychological, and social well-being that affects how a person thinks, feels, and acts',
    example: 'A person with good mental health can cope with stress and maintain relationships',
    difficulty: 'easy',
  },
  {
    id: 'bh-002',
    term: 'Anxiety Disorder',
    definition: 'A mental health condition characterized by excessive worry, fear, or nervousness that interferes with daily activities',
    example: 'Generalized anxiety disorder, panic disorder, and social anxiety disorder are all types',
    difficulty: 'medium',
  },
]

export const quizQuestions = [
  {
    id: 'bh-q001',
    question: 'Which of the following best describes mental health?',
    options: [
      'The absence of any mental illness',
      'A state of emotional, psychological, and social well-being',
      'The ability to memorize information quickly',
      'A measurement of intelligence',
    ],
    answerIndex: 1,
    explanation: 'Mental health is defined as a state of well-being, not simply the absence of illness',
    relatedCardId: 'bh-001',
  },
]
