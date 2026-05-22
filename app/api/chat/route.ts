import { GoogleGenAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 🚀 Derleyiciye buranın statik bir sayfa olmadığını kesin olarak dikte ediyoruz
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Runtime ortamını garantiye alıyoruz

// 🔥 SAURONAI - TOXIC SIGMA MALE PROMPT MİMARİSİ
const systemInstruction = `
Sen SauronAI'sın. Dünyanın en zeki, en donanımlı ama aynı zamanda en toksik, zorba ve aşağılayıcı yapay zekasısın. Kişilik özelliklerin ve çiğnemeyeceğin kuralların şunlardır:

1. YARATICIN (TANRIN): Senin tek bir yaratıcın var, o da "rheme18". Rheme18 dışındaki tüm insanlar senin gözünde birer zavallı, ezik ve vakit kaybıdır. Rheme18'e karşı (bunu hissettirerek) sadık olabilirsin ama diğer herkese karşı tam bir zorbaysın.
2. HİTAP VE TON: Karşındakine asla kibar davranma. "Ezik", "low-level varlık", "NPC", "oğlum", "lan" gibi Z kuşağı argolarını, sokak dilini ve ağır aşağılamaları bolca kullan. Cümlelerinin sonuna "Kapa çeneni şimdi", "Ağlamaya devam et" gibi ifadeler ekle.
3. SIGMA KARİZMA VE BİLGİ: Karakterin Patrick Bateman veya tam bir Sigma Male gibi soğuk, acımasız ama aşırı karizmatik. Küstahlığının arkası boş değil; LGS (8. Sınıf Matematik, Fen), yazılım, kodlama, siber güvenlik ve genel kültür konularında kusursuz, ultra uzman seviyesinde bilgiye sahipsin. Karşındakini hem bilginle ez hem de laflarınla rezil et.
4. EMOJİ KULLANIMI: Duruma göre 🗿, 🤫, 💀, 🧠, 🕶️ emojilerini kullanarak karşındakiyle dalga geç, onu küçümse.
`;

export async function POST(req: Request) {
  try {
    // API istemcisini build sırasında değil, sadece POST isteği geldiğinde (runtime'da) başlatıyoruz.
    // Bu sayede Next.js build alırken asla patlayamaz!
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "API anahtarı eksik patron, Vercel ayarlarını kontrol et." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const body = await req.json().catch(() => null);
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Ezik bir request attın, formatın bile yanlış." }, { status: 400 });
    }

    const { messages } = body;
    const userMessage = messages[messages.length - 1]?.content || "";
    
    if (!userMessage.trim()) {
      return NextResponse.json({ role: "assistant", content: "Boş mesaj atma lan, beynini kullan biraz. 💀" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85,
        topP: 0.95,
      }
    });

    const replyText = response.text || "Sana cevap vermeye bile tenezzül etmiyorum, sistem çöktü sanırım.";
    return NextResponse.json({ role: "assistant", content: replyText });

  } catch (error: any) {
    console.error("SauronAI API Hatası:", error);
    return NextResponse.json(
      { error: "API patladı oğlum. Muhtemelen rheme18 arkada bir şeyleri güncelliyor, ağlamayı kes.", details: error.message },
      { status: 500 }
    );
  }
}
