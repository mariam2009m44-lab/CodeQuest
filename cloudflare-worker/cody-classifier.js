// Lightweight character n-gram TF-IDF centroid classifier for Cloudflare Workers.
// It uses the same six labeled categories and training examples as the Python ML engine.
// This is a compact Worker-compatible classifier, not a byte-for-byte sklearn model replica.
import trainingData from "../cody-ml-engine/data/training_data.json";

const CATEGORY_SET = new Set([
  "programming", "math", "science",
  "general_knowledge", "lesson_help", "code_debugging"
]);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي");
}

function ngrams(text) {
  const padded = " " + normalizeText(text).replace(/\s+/g, " ") + " ";
  const grams = new Map();
  for (let n = 2; n <= 5; n++) {
    for (let i = 0; i <= padded.length - n; i++) {
      const gram = padded.slice(i, i + n);
      grams.set(gram, (grams.get(gram) || 0) + 1);
    }
  }
  return grams;
}

function buildClassifier() {
  const examples = Array.isArray(trainingData?.examples) ? trainingData.examples : [];
  const docs = examples.filter(item =>
    item && typeof (item.text || item.question) === "string" &&
    CATEGORY_SET.has(item.label || item.category)
  );
  if (docs.length < 12) throw new Error("Cody training data is incomplete.");

  const documentFrequencies = new Map();
  const prepared = docs.map(item => {
    const grams = ngrams(item.text || item.question);
    for (const gram of grams.keys()) {
      documentFrequencies.set(gram, (documentFrequencies.get(gram) || 0) + 1);
    }
    return { category: item.label || item.category, grams };
  });

  const centroids = new Map();
  for (const category of CATEGORY_SET) centroids.set(category, new Map());

  for (const doc of prepared) {
    const vector = centroids.get(doc.category);
    let norm = 0;
    const weighted = [];
    for (const [gram, count] of doc.grams) {
      const idf = Math.log(1 + docs.length / (1 + documentFrequencies.get(gram)));
      const weight = (1 + Math.log(count)) * idf;
      weighted.push([gram, weight]);
      norm += weight * weight;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [gram, weight] of weighted) {
      vector.set(gram, (vector.get(gram) || 0) + weight / norm);
    }
  }

  for (const vector of centroids.values()) {
    let norm = 0;
    for (const value of vector.values()) norm += value * value;
    norm = Math.sqrt(norm) || 1;
    for (const [gram, value] of vector) vector.set(gram, value / norm);
  }

  return { docs, documentFrequencies, centroids };
}

let classifier;
export function classifyCodyQuestion(question) {
  const clean = normalizeText(question);
  if (!clean) throw new Error("Question is empty.");
  classifier ||= buildClassifier();

  const grams = ngrams(clean);
  const vector = new Map();
  let norm = 0;
  for (const [gram, count] of grams) {
    const df = classifier.documentFrequencies.get(gram) || 0;
    const idf = Math.log(1 + classifier.docs.length / (1 + df));
    const weight = (1 + Math.log(count)) * idf;
    vector.set(gram, weight);
    norm += weight * weight;
  }
  norm = Math.sqrt(norm) || 1;

  const scores = [];
  for (const [category, centroid] of classifier.centroids) {
    let score = 0;
    for (const [gram, weight] of vector) {
      score += (weight / norm) * (centroid.get(gram) || 0);
    }
    scores.push({ category, score });
  }
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0] || { category: "lesson_help", score: 0 };
  const second = scores[1]?.score || 0;
  const margin = Math.max(0, best.score - second);
  const confidence = Math.max(0, Math.min(1, best.score * (0.7 + margin)));
  return {
    category: best.score < 0.04 ? "lesson_help" : best.category,
    confidence: Number(confidence.toFixed(4)),
    needs_review: best.score < 0.12 || margin < 0.008
  };
}
