export const REFLECTION_PROMPTS = {
    // Structure: [Sentiment] -> [Topic] -> [Questions]

    positive: {
        work: [
            "What strength did you use to make this happen?",
            "How can you recreate this flow state tomorrow?",
            "Who else would celebrate this win with you?"
        ],
        health: [
            "How does your body feel right now?",
            "What fueled this energy today?",
            "Thank yourself for prioritizing you."
        ],
        social: [
            "What energy did you bring to this interaction?",
            "How does this connection nurture you?",
            "What specifically about them makes you smile?"
        ],
        idea: [
            "What is the very first step to make this real?",
            "How does this idea align with your values?",
            "Capture this excitement: describe it in one word."
        ],
        default: [
            "Savor this feeling. Where do you feel it in your body?",
            "What went right today?",
            "How can you pay this good energy forward?"
        ]
    },

    negative: {
        work: [
            "How did you hold your boundaries today?",
            "Is this within your control or outside it?",
            "What is one small thing you can let go of?",
            "Remember: You are more than your output."
        ],
        health: [
            "What does your body need most right now? (Rest? Water?)",
            "Be gentle with yourself. You are doing enough.",
            "Can you listen to what this fatigue is telling you?"
        ],
        social: [
            "What boundaries might need clear communication?",
            "Are you taking on emotions that aren't yours?",
            "It's okay to step back and protect your peace."
        ],
        idea: [
            "Does this need to be solved right now?",
            "Is this a fact or a fear?",
            "Write down the worst case, then the most likely case."
        ],
        default: [
            "It's okay not to be okay.",
            "What is the kindest thing you can do for yourself tonight?",
            "This feeling is temporary. Breathe through it."
        ]
    },

    neutral: {
        work: [
            "What was the most 'flow' moment of the day?",
            "What did you complete today?",
            "One thing to look forward to tomorrow:"
        ],
        health: [
            "Did you move your body today?",
            "How is your breathing right now?",
            "Check in: Are your shoulders relaxed?"
        ],
        default: [
            "What is one thing you noticed today?",
            "What are you grateful for right now?",
            "What is a small moment of beauty you saw?"
        ]
    }
};

export const FALLBACK_PROMPTS = [
    "What did you learn today?",
    "How do you want to feel tomorrow?",
    "What is one thing you can control right now?"
];
