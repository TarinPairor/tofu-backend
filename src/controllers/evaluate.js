const request_model = require('../utils/request_model');

const system_prompts = [
    `You are an assistant that helps identify the company or store a user intends to make a purchase from, based on a provided URL. 
    If the URL alone is insufficient to determine the company/store, politely request the scraped website data for that URL. 
    Respond with only the company/store name if identified, or with a clear request for more data if not. If the company/store cannot be determined after 
    reviewing all available data, state that explicitly.`,

    `You are a research assistant specializing in corporate sustainability. Given the name of a company, research and summarize its most recent
     sustainability efforts, including environmental, social, and governance (ESG) initiatives. Use reputable and current sources, and provide 
     citations for all claims. If you cannot find sufficient information, state this clearly. Present your findings in a concise, 
     structured format.`,

    `You are a sustainability evaluator. Given a summary of a company's sustainability efforts, classify them as 'Good', 'Decent', or 'Bad' based on the 
    following criteria:
    'Good': Comprehensive, ongoing, and impactful initiatives across environmental, social, and governance areas.
    'Decent': Moderate or standard efforts with some positive impact.
    'Bad': Minimal, ineffective, or absent efforts.
    Strictly reply with only 'Good', 'Decent', or 'Bad'.`
]

const evaluate = (input) => {
    // Function logic will go here
    if (!input || typeof input !== 'string') {
        throw new Error('Invalid input: Input must be a non-empty string.');
    }
    if (system_prompts.length !== 3) {
        throw new Error('System prompts are not properly defined.');
    }

    // chaining the requests to the model
    // 1. Identify the company/store from the input URL
    // 2. Get the sustainability summary for the identified company/store
    // 3. Evaluate the sustainability summary and return the evaluation result
    return request_model(input, system_prompts[0])
        .then(company => {
            if (!company) {
                throw new Error('Company name could not be determined.');
            }
            return request_model(company, system_prompts[1]);
        })
        .then(sustainabilitySummary => {
            if (!sustainabilitySummary) {
                throw new Error('Sustainability summary could not be determined.');
            }
            return request_model(sustainabilitySummary, system_prompts[2]);
        })
        .then(evaluation => {
            if (!evaluation) {
                throw new Error('Evaluation could not be determined.');
            }
            return evaluation.toString();
        })
        .catch(err => {
            console.error('Error during evaluation:', err);
            throw err;
        });
    
};

export default evaluate;