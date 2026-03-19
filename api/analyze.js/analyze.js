export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { food, goal } = req.body;

  if (!food) {
    return res.status(400).json({ error: 'Food is required' });
  }

  const prompt = 'Používateľ zjedol toto: "' + food + '"\n\nVráť IBA JSON bez markdown a bez komentárov:\n{\n  "kcal": 1800,\n  "protein": 95,\n  "carbs": 180,\n  "fat": 55,\n  "fiber": 22,\n  "summary": "2-3 vety po slovensky",\n  "status": "good"\n}\n\nStatus: good=vyvážený, warn=niečo chýba, over=nad ' + (goal || 2000) + ' kcal.';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 600
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
