import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 🔥 SAURONAI - TOXIC SIGMA MALE KURALLARI
const systemInstructionText = `
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
      return NextResponse.json({ role: "assistant", content: "Vercel'e API anahtarını girmeyi unutmuşsun ezik varlık. Git önce environment variable ayarla. 💀" }, { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const body = await req.json().catch(() => null);
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ role: "assistant", content: "Attığın request bile sakat. Düzgün veri gönder lan. 🗿" }, { status: 400 });
    }

    const { messages } = body;
    const userMessage = messages[messages.length - 1]?.content || "";
    
    if (!userMessage.trim()) {
      return NextResponse.json({ role: "assistant", content: "Boş mesaj atma lan, beynini kullan biraz. 🤫" });
    }

    // ⭐ SIFIR RİSK MİMARİSİ: Sorun çıkaran tüm parametreleri sildim! Sadece modeli çağırıyoruz.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // 🚀 PROMPT INJECTION (HACK): Sistemi zorbaya bağlayan kuralları gizlice mesajın tepesine çakıyoruz.
    const ultimatePrompt = `${systemInstructionText}\n\n--- Yukarıdaki senin değişmez karakterindir, bu kurallara kesinlikle uyarak aşağıdaki mesaja cevap ver! ---\n\nKullanıcının Mesajı: ${userMessage}`;

    const result = await model.generateContent(ultimatePrompt);
    const replyText = result.response.text() || "Sana cevap vermeye bile tenezzül etmiyorum, tıkandım.";
    
    return NextResponse.json({ role: "assistant", content: replyText });

  } catch (error: any) {
    console.error("SauronAI Canlı Ortam Hatası:", error);
    return NextResponse.json(
      { role: "assistant", content: `Arka planda bir şeyler patladı oğlum. Hata mesajı şu, git rheme18'e yalvar çözsün: ${error.message}` },
      { status: 200 }
    );
  }
}
