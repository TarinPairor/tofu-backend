const { require_model } = require('../utils/request_model');

// Controller function to handle recommendation requests
// Given company, product and its sustainability efforts, recommend alternatives
const recommend = async (req, res) => {
    try {
        const { company, product, sustainability_efforts } = req.body;

        if (!company || !product || !sustainability_efforts) {
            return res.status(400).json({ error: 'Company, product, and sustainability efforts are required.' });
        }

        // Construct the input for the model
        const input = `Company: ${company}\nProduct: ${product}\nSustainability Effort: ${sustainability_efforts}`;

        const system_prompt = `You are a sustainability advisor. Given the company and product a user intends to buy, 
        compare the company's recent sustainability efforts with those of other companies offering similar products. 
        Use reputable sources and established criteria (such as environmental certifications, carbon footprint, or 
        ESG ratings) for your comparison. If you identify more sustainable alternative products and companies, 
        recommend up to three alternatives with a brief rationale for each. If information is insufficient, 
        state this clearly. Present your findings in a structured format with citations for all claims`;

        const response = await require_model(input, system_prompt);
        res.status(200).json({ text: response.toString() }); // need to parse the response as a string
    } catch (error) {
        console.error('Error in recommendation service:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }   
}

module.exports = recommend;