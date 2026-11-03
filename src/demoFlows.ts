export type Speaker = 'coach' | 'learner'
export type Visual = 'pointer-trace' | 'dp-grid' | 'test-result' | 'transfer'

export type Turn = {
  id: string
  speaker: Speaker
  text: string
  stage: 0 | 1 | 2 | 3
  eyebrow?: string
  visual?: Visual
  practice?: {
    problem: string
    number: string
    difficulty: 'Medium' | 'Hard'
    reason: string
    prompt: string
  }
}

export type DemoFlow = {
  id: 'fast' | 'guided'
  name: string
  shortName: string
  description: string
  turns: Turn[]
}

export const flows: Record<DemoFlow['id'], DemoFlow> = {
  fast: {
    id: 'fast',
    name: 'Faster progression',
    shortName: 'Faster',
    description: 'The learner notices the alignment issue quickly, so the coach reduces scaffolding.',
    turns: [
      {
        id: 'fast-01',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'Diagnose first',
        text: 'Before writing code, talk me through how you would find a shared substring in `ABABC` and `BABCA`.',
      },
      {
        id: 'fast-02',
        speaker: 'learner',
        stage: 0,
        text: 'I would put one pointer at the start of each string. If the characters match, move both. If not, reset the current match and move on.',
      },
      {
        id: 'fast-03',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'Probe the assumption',
        text: 'That checks one alignment. What happens when the best match begins at different offsets, such as `BABC` here? Trace just enough positions to test your assumption.',
      },
      {
        id: 'fast-04',
        speaker: 'learner',
        stage: 0,
        text: 'Moving both pointers together can skip it. I would need to try every starting pair, which becomes expensive.',
      },
      {
        id: 'fast-05',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'A directional hint',
        text: 'Exactly. One pointer pair is not enough because many alignments can be active. Imagine memory indexed once by an ending position in `s1` and once by an ending position in `s2`. What shape would that memory have, and what should one entry remember?',
      },
      {
        id: 'fast-06',
        speaker: 'learner',
        stage: 1,
        text: 'That suggests a 2D table. `dp[i][j]` can be the length of the common substring ending at `s1[i - 1]` and `s2[j - 1]`. A match extends the diagonal; a mismatch resets to zero.',
      },
      {
        id: 'fast-07',
        speaker: 'coach',
        stage: 1,
        eyebrow: 'Concept confirmed',
        text: 'Good. That gives `dp[i][j] = dp[i-1][j-1] + 1` on a match, otherwise `0`. Track the largest cell and its ending index.',
        visual: 'dp-grid',
      },
      {
        id: 'fast-08',
        speaker: 'learner',
        stage: 2,
        text: 'I have implemented the recurrence and will run it on the example plus an offset-match test.',
        visual: 'test-result',
      },
      {
        id: 'fast-09',
        speaker: 'coach',
        stage: 3,
        eyebrow: 'Adaptive next practice',
        text: 'You noticed the alignment gap quickly, so practise `Longest Common Subsequence` next. It begins with your same instinct to compare two positions, but a mismatch no longer destroys all useful progress. Before opening it, predict what the mismatch rule should preserve.',
        visual: 'transfer',
        practice: {
          problem: 'Longest Common Subsequence',
          number: 'LeetCode 1143',
          difficulty: 'Medium',
          reason: 'Builds on your pair-of-pointers intuition while contrasting contiguous and non-contiguous matches.',
          prompt: 'On mismatch, what information from the top and left states is still useful?',
        },
      },
      {
        id: 'fast-10',
        speaker: 'learner',
        stage: 3,
        text: 'I would still index a grid by both positions. Since subsequences allow gaps, a mismatch should preserve the better result from dropping one character: `max(top, left)` instead of resetting to `0`.',
      },
    ],
  },
  guided: {
    id: 'guided',
    name: 'More scaffolding',
    shortName: 'Guided',
    description: 'The learner remains attached to two pointers, so the coach slows down and makes the gap visible.',
    turns: [
      {
        id: 'guided-01',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'Diagnose first',
        text: 'Before writing code, talk me through how you would find a shared substring in `ABABC` and `BABCA`.',
      },
      {
        id: 'guided-02',
        speaker: 'learner',
        stage: 0,
        text: 'Two pointers should work. I compare both strings from the start and reset the match whenever the characters differ.',
      },
      {
        id: 'guided-03',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'Test the intuition',
        text: 'Let us trace that rather than replace it. With both pointers at index `0`, which characters are compared, and what does your rule do next?',
        visual: 'pointer-trace',
      },
      {
        id: 'guided-04',
        speaker: 'learner',
        stage: 0,
        text: 'It compares `A` with `B`, then advances both after the mismatch. I would keep doing that until I see a match.',
      },
      {
        id: 'guided-05',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'Pace slowed',
        text: 'Now hold the first pointer at the first `B` in `ABABC`, while the second stays at the first `B` in `BABCA`. What sequence appears?',
      },
      {
        id: 'guided-06',
        speaker: 'learner',
        stage: 0,
        text: 'That gives `BABC`, length four. My original lockstep scan never considers that offset, so it can miss the answer.',
      },
      {
        id: 'guided-07',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'Build from base cases',
        text: 'Right. Let us store results for all alignments. For one-character prefixes, what should the value be when the final characters match? What about when they differ?',
      },
      {
        id: 'guided-08',
        speaker: 'learner',
        stage: 0,
        text: 'It should be `1` when they match and `0` when they differ.',
      },
      {
        id: 'guided-09',
        speaker: 'coach',
        stage: 0,
        text: 'Good. Let `dp[i][j]` describe a common substring that ends exactly at those two positions. How would you use the previous characters?',
      },
      {
        id: 'guided-10',
        speaker: 'learner',
        stage: 0,
        text: 'Maybe take the maximum of the top or left cell so we keep the best answer seen so far?',
      },
      {
        id: 'guided-11',
        speaker: 'coach',
        stage: 0,
        eyebrow: 'Misconception isolated',
        text: 'That would preserve a non-contiguous match—the subsequence rule. If the final characters differ, can a substring ending at both positions continue?',
      },
      {
        id: 'guided-12',
        speaker: 'learner',
        stage: 1,
        text: 'No. A mismatch breaks contiguity, so the cell resets to `0`. On a match, it is the diagonal value plus one.',
      },
      {
        id: 'guided-13',
        speaker: 'coach',
        stage: 1,
        eyebrow: 'Model made visible',
        text: 'Exactly. The diagonal chain is the current contiguous run. The largest chain below has length four and ends at the `C` in `ABABC`.',
        visual: 'dp-grid',
      },
      {
        id: 'guided-14',
        speaker: 'learner',
        stage: 2,
        text: 'I have implemented the recurrence, tracked the best ending position, and I am ready to run the tests.',
        visual: 'test-result',
      },
      {
        id: 'guided-15',
        speaker: 'coach',
        stage: 3,
        eyebrow: 'Adaptive next practice',
        text: 'Your main obstacle was seeing that lockstep pointers miss shifted starts. Practise `Maximum Length of Repeated Subarray` next: it keeps today’s diagonal-and-reset structure, but replaces characters with integers. How would your original two-pointer scan fail there?',
        visual: 'transfer',
        practice: {
          problem: 'Maximum Length of Repeated Subarray',
          number: 'LeetCode 718',
          difficulty: 'Medium',
          reason: 'Reinforces the same shifted-alignment gap before introducing a more distant recurrence.',
          prompt: 'Which state, match rule, and reset rule can transfer unchanged from today?',
        },
      },
      {
        id: 'guided-16',
        speaker: 'learner',
        stage: 3,
        text: 'Lockstep pointers would still inspect only one alignment and could miss an equal run that starts later. I can reuse the 2D ending-position state, diagonal-plus-one on a match, and reset-to-zero on a mismatch.',
      },
    ],
  },
}

export const stageLabels = [
  'Initial intuition',
  'Correct recurrence',
  'Working implementation',
  'Transfer',
] as const
