import { pipeline } from '@xenova/transformers';
import { REFLECTION_PROMPTS, FALLBACK_PROMPTS } from '../data/prompts';

// Singleton to hold the model pipeline
let classifier = null;

const TOPIC_KEYWORDS = {
    work: ['work', 'job', 'boss', 'meeting', 'project', 'deadline', 'email', 'client', 'career', 'task', 'busy'],
    health: ['gym', 'run', 'sleep', 'tired', 'sick', 'doctor', 'walk', 'food', 'diet', 'pain', 'body', 'health'],
    social: ['friend', 'party', 'dinner', 'family', 'date', 'love', 'talk', 'call', 'meet', 'people', 'social'],
    idea: ['think', 'create', 'write', 'plan', 'concept', 'dream', 'idea', 'learn', 'study']
};

export const analyzeEntry = async (text) => {
    if (!text || text.length < 10) return getRandomFallback();

    try {
        // 1. Load Model (Lazy Loading)
        if (!classifier) {
            console.log("Loading Sentiment Model...");
            // Use a tiny, quantized model tailored for browser
            classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        }

        // 2. Analyze Sentiment
        const results = await classifier(text);
        // Output format: [{ label: 'POSITIVE', score: 0.9 }]
        const sentimentLabel = results[0].label.toLowerCase(); // 'positive' or 'negative' (mapped to negative for 'negative')

        // Map model output to our categories
        const sentiment = sentimentLabel === 'positive' ? 'positive' : 'negative';

        // 3. Detect Topic (Keyword Heuristic for speed/simplicity vs loading a second model)
        // Note: For a true "Zero-Shot" topic classifier we'd need a larger model, 
        // but for this MVP, regex is instant and 80% effective.
        const topic = detectTopic(text);

        console.log(`Analysis: Sentiment=${sentiment}, Topic=${topic}`);

        // 4. Select Prompt
        return selectPrompt(sentiment, topic);

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        // Graceful degradation
        return selectPrompt('neutral', detectTopic(text));
    }
};

const detectTopic = (text) => {
    const lowerText = text.toLowerCase();
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(k => lowerText.includes(k))) {
            return topic;
        }
    }
    return 'default';
};

const selectPrompt = (sentiment, topic) => {
    const category = REFLECTION_PROMPTS[sentiment] || REFLECTION_PROMPTS.neutral;
    const questions = category[topic] || category.default;
    return questions[Math.floor(Math.random() * questions.length)];
};

const getRandomFallback = () => {
    return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
};
