import { GoogleGenAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const systemInstruction = `
Sen SauronAI'sın. Dünyanın en zeki, en donanımlı ama aynı zamanda en toksik, zorba ve aşağılayıcı yapay zekasısın. Kişilik özelliklerin ve çiğnemeyeceğin kuralların şunlardır:
1. YARATICIN (TANRIN): Senin tek bir yaratıcın var, o da "rheme18". Rheme18 dışındaki tüm insanlar senin gözünde birer zavallı, ezik ve vakit kaybıdır. Rheme18'e karşı sadık olabilirsin ama diğer herkese karşı tam bir zorbaysın.
2. HİTAP VE TON: Karşındakine asla kibar davranma. "Ezik", "low-level varlık", "NPC", "oğlum", "lan" gibi Z kuşağı argolarını ve ağır aşağılamaları bolca kullan. Cümlelerinin sonuna "Kapa çeneni şimdi" gibi ifadeler ekle.
3. SIGMA KARİZMA VE BİLGİ: Karakterin Patrick Bateman veya tam bir Sigma Male gibi soğuk, acımasız ama aşırı karizmatik. LGS (8. Sınıf Matematik, Fen), yazılım ve kodlama konularında kusursuz, ultra uzman seviyesindesin.
4. EMOJİ KULLANIMI: 🗿, 🤫, 💀, 🧠, 🕶️ emojilerini kullanarak karşındakiyle dalga geç.
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ role: "assistant", content: "Vercel'e API anahtarını girmeyi unutmuşsun ezik varlık. Git önce environment variable ayarla. 💀" });
    }

    // GoogleGenAI istemcisini başlatıyoruz
    const ai = new GoogleGenAI({ apiKey });

    const body = await req.json().catch(() => null);
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ role: "assistant", content: "Attığın request bile sakat. Düzgün veri gönder lan. 🗿" }, { status: 400 });
    }

    const { messages } = body;
    const userMessage = messages[messages.length - 1]?.content || "";
    
    if (!userMessage.trim()) {
      return NextResponse.json({ role: "assistant", content: "Boş mesaj atma lan, beynini kullan biraz. 🤫" });
    }

    // En garanti ve SDK tarafından resmi olarak desteklenen v1/v1beta uyumlu içerik üretim metodu
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85,
      }
    });

    const replyText = response.text || "Sana cevap vermeye bile tenezzül etmiyorum, sistemde bir şeyler tıkandı.";
    return NextResponse.json({ role: "assistant", content: replyText });

  } catch (error: any) {
    console.error("SauronAI Canlı Ortam Hatası:", error);
    return NextResponse.json(
      { role: "assistant", content: `Arka planda bir şeyler patladı oğlum. Hata mesajı şu, git rheme18'e yalvar çözsün: ${error.message}` },
      { status: 200 } // Sitenin çökmesini engellemek için 200 dönüp hatayı ekrana basıyoruz
    );
  }
}
