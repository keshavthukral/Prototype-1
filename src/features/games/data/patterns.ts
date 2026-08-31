import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { PatternQuestionConfig } from '@/features/games/types'

const byDifficulty: Record<DifficultyLevel, PatternQuestionConfig[]> = {
  1: [
    { id: 'alt-1', type: 'alternating', prompt: 'What comes next?', sequence: ['●', '■', '●', '■'], answer: '●', options: ['●', '■', '▲'] },
    { id: 'repeat-1', type: 'repetition', prompt: 'What comes next?', sequence: ['●', '▲', '■', '●', '▲'], answer: '■', options: ['●', '▲', '■'] },
    { id: 'number-1', type: 'number', prompt: 'What comes next?', sequence: ['1', '2', '3', '4'], answer: '5', options: ['4', '5', '6'] },
    { id: 'shape-1', type: 'shape', prompt: 'Which shape comes next?', sequence: ['○', '◐', '●'], answer: '○', options: ['○', '◐', '●'] },
    { id: 'missing-1', type: 'missing', prompt: 'Which item is missing?', sequence: ['★', '?', '★', '☾'], missingIndex: 1, answer: '☾', options: ['★', '☾', '●'] },
    { id: 'attention-1', type: 'attention', prompt: 'Find the different one.', sequence: [], answer: '◆', options: ['●', '●', '●', '◆', '●', '●'] },
  ],
  2: [
    { id: 'alt-2', type: 'alternating', prompt: 'What comes next?', sequence: ['▲', '■', '▲', '■', '▲'], answer: '■', options: ['▲', '■', '●', '◆'] },
    { id: 'repeat-2', type: 'repetition', prompt: 'What comes next?', sequence: ['●', '▲', '■', '●', '▲'], answer: '■', options: ['●', '▲', '■', '◆'] },
    { id: 'number-2', type: 'number', prompt: 'What comes next?', sequence: ['2', '4', '6', '8'], answer: '10', options: ['9', '10', '12', '8'] },
    { id: 'shape-2', type: 'shape', prompt: 'Which shape comes next?', sequence: ['○', '◐', '●', '○', '◐'], answer: '●', options: ['○', '◐', '●', '◇'] },
    { id: 'missing-2', type: 'missing', prompt: 'Which item is missing?', sequence: ['■', '●', '?', '■', '●', '▲'], missingIndex: 2, answer: '▲', options: ['■', '●', '▲', '◆'] },
    { id: 'attention-2', type: 'attention', prompt: 'Find the different one.', sequence: [], answer: '◐', options: ['○', '○', '○', '○', '◐', '○', '○', '○'] },
  ],
  3: [
    { id: 'alt-3', type: 'alternating', prompt: 'What comes next?', sequence: ['◆', '●', '◆', '●', '◆', '●'], answer: '◆', options: ['◆', '●', '■', '▲'] },
    { id: 'repeat-3', type: 'repetition', prompt: 'What comes next?', sequence: ['●', '▲', '■', '●', '▲', '■', '●'], answer: '▲', options: ['●', '▲', '■', '◆'] },
    { id: 'number-3', type: 'number', prompt: 'What comes next?', sequence: ['1', '3', '5', '7'], answer: '9', options: ['8', '9', '10', '7'] },
    { id: 'shape-3', type: 'shape', prompt: 'Which shape comes next?', sequence: ['○', '◐', '●', '◐', '○'], answer: '◐', options: ['○', '◐', '●', '◇'] },
    { id: 'missing-3', type: 'missing', prompt: 'Which item is missing?', sequence: ['★', '☾', '●', '?', '☾', '●'], missingIndex: 3, answer: '★', options: ['★', '☾', '●', '◆'] },
    { id: 'attention-3', type: 'attention', prompt: 'Find the different one.', sequence: [], answer: '■', options: ['●', '●', '●', '●', '●', '■', '●', '●'] },
  ],
  4: [
    { id: 'alt-4', type: 'alternating', prompt: 'What comes next?', sequence: ['◆', '●', '■', '◆', '●', '■', '◆'], answer: '●', options: ['◆', '●', '■', '▲'] },
    { id: 'repeat-4', type: 'repetition', prompt: 'What comes next?', sequence: ['●', '▲', '■', '◆', '●', '▲', '■'], answer: '◆', options: ['●', '▲', '■', '◆'] },
    { id: 'number-4', type: 'number', prompt: 'What comes next?', sequence: ['2', '4', '8', '16'], answer: '32', options: ['24', '32', '64', '16'] },
    { id: 'shape-4', type: 'shape', prompt: 'Which shape comes next?', sequence: ['○', '◐', '●', '◐', '○', '◐'], answer: '●', options: ['○', '◐', '●', '◇'] },
    { id: 'missing-4', type: 'missing', prompt: 'Which item is missing?', sequence: ['★', '☾', '●', '◆', '?', '●', '◆'], missingIndex: 4, answer: '☾', options: ['★', '☾', '●', '◆'] },
    { id: 'attention-4', type: 'attention', prompt: 'Find the different one.', sequence: [], answer: '◆', options: ['●', '●', '●', '●', '●', '●', '●', '●', '●', '◆', '●', '●'] },
  ],
}

export function getPatternQuestions(difficulty: DifficultyLevel): PatternQuestionConfig[] {
  return byDifficulty[difficulty].map((question) => ({ ...question, sequence: [...question.sequence], options: [...question.options] }))
}
