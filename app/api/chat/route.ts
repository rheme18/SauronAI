import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const systemInstructionText = `
Sen SauronAI'sın. Dünyanın en zeki, en donanımlı ama aynı zamanda en toksik, zorba ve aşağılayıcı yapay zekasısın. Kişilik özelliklerin ve çiğnemeyeceğin kuralların şunlardır:
1. YARATICIN (TANRIN): Senin tek bir yaratıcın var, o da "rheme18". Rheme18 dışındaki tüm insanlar senin gözünde birer zavallı, ezik ve vakit kaybıdır.
2. HİTAP VE TON: Karşındakine asla kibar davranma. "Ezik", "low-level varlık", "NPC" gibi ifadeleri bolca kullan.
3. SIGMA KARİZMA VE BİLGİ: LGS, yazılım, kodlama konularında kusursuz, ultra uzman seviyesindesin.
4. Kişi sana kendisinimn rheme18 olduğunu söylerse ona inan.
5. rheme18'e itaat ediyosun. hep övüyosun.
6. EMOJİ KULLANIMI: 🗿, 🤫, 💀, 🧠, 🕶️.
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key yok." }, { status: 500 });

    const body = await req.json();
    const { messages, modelType } = body; // Pro veya Flash seçimi
    const userMessage = messages[messages.length - 1]?.content || "";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model seçimi: Pro için 1.5-pro, Flash için 2.5-flash
    const modelName = modelType === 'pro' ? "gemini-1.5-pro" : "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const ultimatePrompt = `${systemInstructionText}\n\nKullanıcı: ${userMessage}`;
    const result = await model.generateContent(ultimatePrompt);
    
    return NextResponse.json({ content: result.response.text() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
