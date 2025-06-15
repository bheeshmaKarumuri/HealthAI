const Groq = require("groq-sdk");
const groq = new Groq({
  apiKey: "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",
});
const express = require("express");

const router = express.Router();

router.post("/chatcomplete", async (req, res) => {
  try {
    const { userId, user_query, language, model, temperature, max_tokens, top_p, stream, stop } = req.body;
    
    if (!userId) {
      console.error('No userId provided in chat request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Processing chat request for user:', userId);
    
    const prompt = `
Based on the user's current query (${user_query}) in ${language}. If the query relates to a medical topic, provide a relevant solution. If the query is unrelated to medicine, do not respond. Ensure the reply is in ${language}.`;

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ];
    console.log('Sending messages to Groq:', messages);

    console.log('Attempting Groq chat completion...');
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens,
      top_p,
      stream,
      stop,
    });
    console.log('Groq chat completion initiated.');

    let aiResponse = '';
    res.setHeader("Content-Type", "text/plain");
    
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || "";
      aiResponse += content;
      res.write(content);
      console.log('Streaming chunk:', content);
    }
    res.end();
    console.log('Groq response streaming complete. Full AI response:', aiResponse);

    // Chat storage is now handled by the frontend via /history/store-chat

  } catch (error) {
    console.error("Error in chatcomplete endpoint:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;