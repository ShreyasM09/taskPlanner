import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/generate-plan", async (req, res) => {
    try {
        const { goal, deadline, experienceLevel } = req.body;

        if (!goal) {
            return res.status(400).json({ error: "Goal is required." });
        }

        const today = new Date().toISOString().split("T")[0];

        const prompt = `
You are an expert AI project planner.

Take the user's goal and output a structured, step-by-step task plan.

Input:
- Goal: "${goal}"
- Deadline: "${deadline || "none"}"
- Experience level: "${experienceLevel || "not specified"}"
- Today's date: ${today}

Output strictly in JSON (no explanations, no markdown, no extra text):
{
  "goal": "string",
  "tasks": [
    {
      "task": "string",
      "description": "string",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "dependencies": ["string"]
    }
  ]
}

Rules:
- Divide into 3-10 tasks.
- Evenly distribute start and end dates between now and the deadline.
- Logical dependencies only.
- If no deadline is given, assume a 2-week plan.
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });



        const result = await model.generateContent(prompt);

        let textResponse = result.response.text().trim();


        textResponse = textResponse.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();

        let parsed;
        try {
            parsed = JSON.parse(textResponse);
        } catch (err) {
            console.error("Error parsing Gemini response:", err);
            return res.status(500).json({ error: "Invalid JSON format from Gemini.", raw: textResponse });
        }

        res.json(parsed);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
