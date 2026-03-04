// Simple translation utility using Google Translate API (or mock)
// For production, replace with a proper backend or paid API

export async function translateText(text: string, targetLang: 'hi' | 'ta') {
  // For demo: use Google Translate API (CORS may block in prod)
  // Replace with backend call if needed
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data[0]?.map((t: any) => t[0]).join('') || text;
  } catch {
    return text;
  }
}
