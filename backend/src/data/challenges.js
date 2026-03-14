// src/data/challenges.js
/**
 * Challenge format:
 * {
 *   id: string,
 *   topic: "Loops" | "Recursion" | "Arrays" | "Strings" | ...,
 *   difficulty: "easy" | "medium" | "hard",
 *   title: string,
 *   prompt: string,
 *   functionName: string,
 *   signature: string,
 *   starterCode: string,
 *   solution?: string,
 *   cases: Array<{ args: any[], expected: any, description?: string }>
 * }
 */

const CHALLENGES = [
  {
    id: "loops-sum-array",
    topic: "Loops",
    difficulty: "easy",
    title: "Sum of Array",
    prompt:
      "Write a function `sum_array(arr)` that returns the sum of all numbers in the list `arr`.\n\nExamples:\n- sum_array([1,2,3]) -> 6\n- sum_array([]) -> 0",
    functionName: "sum_array",
    signature: "def sum_array(arr):",
    starterCode: `def sum_array(arr):
    # TODO: use a loop to sum all numbers
    total = 0
    for x in arr:
        total += x
    return total
`,
    solution: `def sum_array(arr):
    total = 0
    for x in arr:
        total += x
    return total
`,
    cases: [
      { args: [[]], expected: 0, description: "empty list" },
      { args: [[1, 2, 3]], expected: 6, description: "small positive numbers" },
      { args: [[-1, 5, -2]], expected: 2, description: "includes negatives" },
      { args: [[10, 20, 30, 40]], expected: 100, description: "larger list" },
    ],
  },

  {
    id: "recursion-factorial",
    topic: "Recursion",
    difficulty: "easy",
    title: "Factorial (Recursive)",
    prompt:
      "Write a recursive function `factorial(n)` that returns n! (n factorial). Assume n is a non-negative integer.\n\nExamples:\n- factorial(0) -> 1\n- factorial(5) -> 120",
    functionName: "factorial",
    signature: "def factorial(n):",
    starterCode: `def factorial(n):
    # Base case
    if n == 0:
        return 1
    # Recursive case
    return n * factorial(n - 1)
`,
    solution: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
`,
    cases: [
      { args: [0], expected: 1, description: "zero" },
      { args: [5], expected: 120, description: "five factorial" },
      { args: [3], expected: 6, description: "three factorial" },
    ],
  },

  {
    id: "arrays-max",
    topic: "Arrays",
    difficulty: "medium",
    title: "Maximum in List",
    prompt:
      "Implement `max_in_list(arr)` that returns the maximum number in `arr`. If the list is empty, return `float('-inf')`.",
    functionName: "max_in_list",
    signature: "def max_in_list(arr):",
    starterCode: `def max_in_list(arr):
    if len(arr) == 0:
        return float('-inf')
    m = arr[0]
    for x in arr[1:]:
        if x > m:
            m = x
    return m
`,
    solution: `def max_in_list(arr):
    if len(arr) == 0:
        return float('-inf')
    m = arr[0]
    for x in arr[1:]:
        if x > m:
            m = x
    return m
`,
    cases: [
      { args: [[]], expected: Number.NEGATIVE_INFINITY /* will be converted at runtime */, description: "empty list" },
      { args: [[-5, 10, 2]], expected: 10, description: "mixed negative and positive" },
      { args: [[7]], expected: 7, description: "single element" },
    ],
  },

  {
    id: "strings-reverse",
    topic: "Strings",
    difficulty: "medium",
    title: "Reverse String",
    prompt:
      "Write `reverse_string(s)` that returns a new string which is the reverse of `s`.",
    functionName: "reverse_string",
    signature: "def reverse_string(s):",
    starterCode: `def reverse_string(s):
    out = ''
    for i in range(len(s) - 1, -1, -1):
        out += s[i]
    return out
`,
    solution: `def reverse_string(s):
    return s[::-1]
`,
    cases: [
      { args: ["hello"], expected: "olleh", description: "regular string" },
      { args: [""], expected: "", description: "empty string" },
      { args: ["racecar"], expected: "racecar", description: "palindrome" },
    ],
  },

  {
    id: "loops-count-vowels",
    topic: "Loops",
    difficulty: "easy",
    title: "Count Vowels",
    prompt:
      "Write `count_vowels(s)` that returns the number of vowels in string `s`. Count a, e, i, o, u (both lower and upper case).",
    functionName: "count_vowels",
    signature: "def count_vowels(s):",
    starterCode: `def count_vowels(s):
    vowels = set('aeiouAEIOU')
    count = 0
    for ch in s:
        if ch in vowels:
            count += 1
    return count
`,
    solution: `def count_vowels(s):
    return sum(1 for ch in s if ch.lower() in 'aeiou')
`,
    cases: [
      { args: ["hello"], expected: 2, description: "two vowels" },
      { args: [""], expected: 0, description: "empty" },
      { args: ["AEIOU"], expected: 5, description: "uppercase vowels" },
    ],
  },

  {
    id: "recursion-fibonacci",
    topic: "Recursion",
    difficulty: "medium",
    title: "Nth Fibonacci (Recursive)",
    prompt:
      "Write `fib(n)` that returns the nth Fibonacci number (0-indexed): fib(0)=0, fib(1)=1. Use recursion.",
    functionName: "fib",
    signature: "def fib(n):",
    starterCode: `def fib(n):
    if n == 0:
        return 0
    if n == 1:
        return 1
    return fib(n-1) + fib(n-2)
`,
    solution: `def fib(n):
    if n < 2:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b
`,
    cases: [
      { args: [0], expected: 0, description: "zero" },
      { args: [1], expected: 1, description: "one" },
      { args: [6], expected: 8, description: "sixth" },
    ],
  },

  {
    id: "arrays-two-sum",
    topic: "Arrays",
    difficulty: "hard",
    title: "Two Sum (Indices)",
    prompt:
      "Given a list of integers `nums` and an integer `target`, return a pair of indices (i, j) such that nums[i] + nums[j] == target. Return `None` if no such pair exists. Assume exactly one solution may exist for easier testing.",
    functionName: "two_sum",
    signature: "def two_sum(nums, target):",
    starterCode: `def two_sum(nums, target):
    # naive approach
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return (i, j)
    return None
`,
    solution: `def two_sum(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        need = target - v
        if need in seen:
            return (seen[need], i)
        seen[v] = i
    return None
`,
    cases: [
      { args: [[2,7,11,15], 9], expected: [0,1], description: "basic pair at start" },
      { args: [[3,2,4], 6], expected: [1,2], description: "pair in middle/end" },
      { args: [[3,3], 6], expected: [0,1], description: "duplicates" },
      { args: [[1,2,3], 7], expected: null, description: "no valid pair" },
    ],
  },

  {
    id: "strings-is-anagram",
    topic: "Strings",
    difficulty: "easy",
    title: "Is Anagram",
    prompt:
      "Write `is_anagram(a, b)` that returns True if string `a` is an anagram of string `b` (ignoring spaces and case), otherwise False.",
    functionName: "is_anagram",
    signature: "def is_anagram(a, b):",
    starterCode: `def is_anagram(a, b):
    a_clean = ''.join(ch.lower() for ch in a if ch.isalnum())
    b_clean = ''.join(ch.lower() for ch in b if ch.isalnum())
    return sorted(a_clean) == sorted(b_clean)
`,
    solution: `def is_anagram(a, b):
    from collections import Counter
    a_clean = ''.join(ch.lower() for ch in a if ch.isalnum())
    b_clean = ''.join(ch.lower() for ch in b if ch.isalnum())
    return Counter(a_clean) == Counter(b_clean)
`,
    cases: [
      { args: ["listen", "silent"], expected: true, description: "simple anagram" },
      { args: ["Triangle", "Integral"], expected: true, description: "case-insensitive" },
      { args: ["a gentleman", "elegant man"], expected: true, description: "spaces ignored" },
      { args: ["abc", "abx"], expected: false, description: "not anagram" },
    ],
  },
];

// Normalize some JS values used above (Number.NEGATIVE_INFINITY, true/false -> boolean)
for (const ch of CHALLENGES) {
  ch.cases = ch.cases.map((c) => {
    const expected = (function (v) {
      if (v === Number.NEGATIVE_INFINITY) return Number.NEGATIVE_INFINITY;
      if (v === null) return null;
      if (v === true) return true;
      if (v === false) return false;
      return v;
    })(c.expected);
    return { args: c.args, expected, description: c.description || "" };
  });
}

function pickRandomChallenge({ topic, difficulty, excludeIds } = {}) {
  let pool = CHALLENGES.filter((c) => {
    if (topic && String(c.topic).toLowerCase() !== String(topic).toLowerCase()) return false;
    if (difficulty && String(c.difficulty).toLowerCase() !== String(difficulty).toLowerCase()) return false;
    if (Array.isArray(excludeIds) && excludeIds.includes(c.id)) return false;
    return true;
  });
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function findChallengeById(id) {
  return CHALLENGES.find((c) => c.id === id) || null;
}

function getAllChallengesByTopicAndDifficulty(topic, difficulty) {
  return CHALLENGES.filter((c) => {
    if (topic && String(c.topic).toLowerCase() !== String(topic).toLowerCase()) return false;
    if (difficulty && String(c.difficulty).toLowerCase() !== String(difficulty).toLowerCase()) return false;
    return true;
  });
}

module.exports = {
  CHALLENGES,
  pickRandomChallenge,
  findChallengeById,
  getAllChallengesByTopicAndDifficulty,
};
