import { GoogleGenAI } from "@google/genai";
import { GameStats } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeBattle = async (stats: GameStats): Promise<string> => {
  try {
    const ai = getClient();
    
    const prompt = `
      Ты опытный тактик фэнтези-битв. Проанализируй текущую ситуацию на поле боя.

      СВОДКА ВОЙСК:
      ${stats.detailedUnitSummary}
      
      Всего юнитов: ${stats.totalUnits} (Красные: ${stats.redCount}, Синие: ${stats.blueCount})

      Твоя задача:
      1. Оцени баланс сил, учитывая не только количество, но и состав (танки, дд, маги, герои).
      2. Кто сейчас доминирует по здоровью и количеству?
      3. Дай ОДИН конкретный, нестандартный тактический совет проигрывающей стороне (например: "Используйте саперов для прорыва строя" или "Нужен хилер для поддержки гигантов").
      
      Отвечай как суровый командир. Будь краток (максимум 3-4 предложения).
      Отвечай на русском языке.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Связь с командованием потеряна. Приказов нет.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Тактический канал оффлайн. Действуйте по обстоятельствам.";
  }
};