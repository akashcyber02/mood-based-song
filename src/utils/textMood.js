/**
 * Text Emotion Classifier in JavaScript
 * Lexical sentiment & emotion scoring with negation handling.
 */

const MOOD_LEXICON = {
  Happy: {
    strong: [
      'happy', 'joy', 'excited', 'thrilled', 'ecstatic', 'delighted', 'grateful',
      'blessed', 'wonderful', 'celebrating', 'smile', 'smiling', 'fun', 'cheerful',
      'amazing', 'awesome', 'fantastic', 'elated', 'overjoyed', 'love', 'dance'
    ],
    mild: ['good', 'nice', 'content', 'glad', 'fine', 'pleased', 'sunny', 'laugh', 'sweet'],
  },
  Sad: {
    strong: [
      'sad', 'depressed', 'heartbroken', 'crying', 'tears', 'hopeless', 'devastated',
      'grief', 'miserable', 'lonely', 'alone', 'unhappy', 'hurting', 'lost', 'empty', 'pain'
    ],
    mild: ['down', 'gloomy', 'melancholy', 'low', 'blue', 'disappointed', 'miss', 'sigh'],
  },
  Relaxed: {
    strong: [
      'relaxed', 'chill', 'peaceful', 'calm', 'serene', 'unwind', 'meditate', 'tranquil',
      'destress', 'laidback', 'restful', 'soothing', 'sleep', 'sleeping', 'slow'
    ],
    mild: ['easy', 'breathe', 'quiet', 'cozy', 'soft', 'sleepy', 'comfortable', 'gentle', 'tea'],
  },
  Energetic: {
    strong: [
      'energetic', 'hyper', 'pumped', 'hyped', 'workout', 'gym', 'running', 'sprint',
      'adrenaline', 'party', 'fire', 'unstoppable', 'beast', 'rave', 'banger'
    ],
    mild: ['active', 'motivated', 'fast', 'jump', 'power', 'boost', 'vibrant', 'drive'],
  },
  Focus: {
    strong: [
      'focus', 'studying', 'study', 'coding', 'code', 'programming', 'homework',
      'assignment', 'exam', 'reading', 'concentrate', 'concentration', 'deep', 'work', 'prep'
    ],
    mild: ['project', 'task', 'learn', 'office', 'deadline', 'busy', 'notes'],
  },
  Angry: {
    strong: [
      'angry', 'furious', 'mad', 'rage', 'enraged', 'pissed', 'livid', 'hate',
      'screaming', 'irritated', 'frustrated', 'infuriating', 'outraged', 'fury'
    ],
    mild: ['annoyed', 'upset', 'bothered', 'cranky', 'grouchy', 'bitter', 'bad'],
  },
};

const NEGATIONS = new Set(['not', 'never', 'no', 'hardly', 'barely', 'scarcely', 'cannot', "can't", "don't", "won't"]);

export function detectMoodFromText(text) {
  if (!text || !text.trim()) {
    return {
      mood: 'Happy',
      confidence: 50,
      matchedWords: [],
      explanation: 'Defaulted to Happy',
    };
  }

  const cleanText = text.toLowerCase();
  const words = cleanText.match(/\b[a-z']+\b/g) || [];

  const scores = { Happy: 0, Sad: 0, Relaxed: 0, Energetic: 0, Focus: 0, Angry: 0 };
  const matches = { Happy: [], Sad: [], Relaxed: [], Energetic: [], Focus: [], Angry: [] };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isNegated = [1, 2].some((offset) => i - offset >= 0 && NEGATIONS.has(words[i - offset]));

    for (const [mood, categories] of Object.entries(MOOD_LEXICON)) {
      if (categories.strong.includes(word)) {
        if (isNegated) {
          scores[mood] -= 2.0;
        } else {
          scores[mood] += 3.0;
          matches[mood].push(word);
        }
      } else if (categories.mild.includes(word)) {
        if (isNegated) {
          scores[mood] -= 1.0;
        } else {
          scores[mood] += 1.5;
          matches[mood].push(word);
        }
      }
    }
  }

  let bestMood = 'Relaxed';
  let maxScore = -Infinity;
  for (const [mood, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestMood = mood;
    }
  }

  if (maxScore <= 0) {
    return {
      mood: 'Relaxed',
      confidence: 50,
      matchedWords: ['neutral tone'],
      explanation: 'No strong emotional indicators detected, relaxed vibe recommended.',
    };
  }

  const positiveSum = Object.values(scores).reduce((acc, s) => acc + Math.max(0, s), 0);
  const confidence = Math.min(96, Math.round((maxScore / (positiveSum || 1)) * 100));

  return {
    mood: bestMood,
    confidence,
    matchedWords: matches[bestMood],
    explanation: `Matched sentiment keywords: [${matches[bestMood].join(', ')}]`,
  };
}
