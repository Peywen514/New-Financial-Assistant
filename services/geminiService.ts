import { GoogleGenAI } from "@google/genai";
import { StockAnalysis, RetirementPlan, RetirementResult } from "../types";

// Helper to get key from storage or env
const getApiKey = (): string | null => {
  // 1. Check LocalStorage
  const stored = localStorage.getItem('gemini_api_key');
  if (stored) return stored;
  
  // 2. Check Environment Variables (Vite or Standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  
  return null;
};

// Initialize Gemini Client dynamically
const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey });
};

// Helper function to extract JSON from Markdown code blocks
const extractJson = (text: string): any => {
  try {
    // Try to find JSON inside code blocks ```json ... ```
    const jsonMatch = text.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try to find array brackets if code block is missing
    const arrayMatch = text.match(/\[([\s\S]*?)\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    // Fallback: try parsing the whole text
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", text);
    return [];
  }
};

export const analyzePortfolio = async (symbols: string[]): Promise<StockAnalysis[]> => {
  const model = "gemini-2.5-flash";
  if (!symbols || symbols.length === 0) return [];

  try {
    const ai = getAIClient();
    const prompt = `
      你是一個專業的金融分析系統。請使用 Google Search 查詢以下股票的「最新即時股價」或「今日收盤價」：${symbols.join(", ")}。
      
      **重要指令：**
      1. 務必使用 Google Search 獲取真實數據，不要使用估算值。
      2. 「currentPrice」必須是查詢到的最新價格。
      3. 請針對持有狀況給出建議 (BUY/SELL/HOLD)。
      
      請回傳一個純 JSON 陣列 (Array)，不要包含其他解釋文字，格式如下：
      [
        {
          "symbol": "股票代碼 (e.g. 0050)",
          "name": "股票名稱",
          "marketCap": "市值 (e.g. 3000億)",
          "high52Week": 數字 (52週最高),
          "low52Week": 數字 (52週最低),
          "currentPrice": 數字 (最新查到的精確價格),
          "suggestBuyPrice": 數字 (建議買入價),
          "suggestSellPrice": 數字 (建議賣出價),
          "recommendation": "BUY" | "SELL" | "HOLD",
          "analysis": "簡短分析 (包含查到的最新新聞或價格資訊)",
          "projectedAnnualYield": "預估年化殖利率 (e.g. 5-6%)",
          "exampleScenario": "簡短操作建議"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        // Enable Google Search to get real-time data
        tools: [{ googleSearch: {} }],
        // NOTE: responseSchema/responseMimeType cannot be used with tools in some versions,
        // so we ask for JSON in the prompt and parse manually.
      }
    });

    return extractJson(response.text || "[]");

  } catch (error) {
    console.error("Error analyzing portfolio:", error);
    throw error; 
  }
};

export const analyzeMarketTrends = async (): Promise<StockAnalysis[]> => {
  const model = "gemini-2.5-flash";
  
  try {
    const ai = getAIClient();
    const prompt = `
      請使用 Google Search 掃描「今日」或「近3天」台灣股市 (TWSE) 的熱門新聞、成交量排行或法人買賣超資訊。
      找出 3 檔目前討論度最高或趨勢最明顯的股票。
      
      **重要指令：**
      1. 使用搜尋工具確保價格 (currentPrice) 是最新的收盤價。
      2. analysis 欄位需說明是因為哪則新聞或事件而熱門。
      
      請回傳一個純 JSON 陣列 (Array)，不要包含其他解釋文字，格式如下：
      [
        {
          "symbol": "股票代碼",
          "name": "股票名稱",
          "marketCap": "市值",
          "high52Week": 數字,
          "low52Week": 數字,
          "currentPrice": 數字 (最新價格),
          "suggestBuyPrice": 數字,
          "suggestSellPrice": 數字,
          "recommendation": "BUY" | "SELL" | "HOLD",
          "analysis": "熱門原因分析",
          "projectedAnnualYield": "預估殖利率",
          "exampleScenario": "操作建議"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    return extractJson(response.text || "[]");

  } catch (error) {
    console.error("Error analyzing trends:", error);
    throw error;
  }
};

export const getRetirementAdvice = async (plan: RetirementPlan, result: RetirementResult): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  try {
    const ai = getAIClient();
    const prompt = `
      使用者正在進行退休規劃。
      現況：
      - 目前年齡: ${plan.currentAge}
      - 預計退休年齡: ${plan.retirementAge}
      - 目前資產: ${plan.currentSavings}
      - 每月儲蓄: ${plan.monthlySavings}
      - 目標預期年化報酬: ${plan.expectedAnnualReturn}%
      - 目標退休後月領: ${plan.targetMonthlyPension}
      
      試算結果：
      - 距離退休還有: ${plan.retirementAge - plan.currentAge} 年
      - 退休時預計累積資產: ${result.totalAccumulated.toFixed(0)}
      - 依據 4% 法則，每月可提領: ${result.monthlyPensionPossible.toFixed(0)}
      - 是否達成目標: ${result.isGoalReachable ? "是" : "否"}
      
      請給予一段約 150 字的專業理財建議。針對是否達成目標提出具體改善策略（如調整儲蓄率、投資組合風險配置等）或肯定其計畫。語氣溫暖但專業。
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      // No tools needed for general advice
    });
    return response.text || "無法產生建議，請稍後再試。";
  } catch (error) {
    console.error("Error getting advice:", error);
    throw error;
  }
};
