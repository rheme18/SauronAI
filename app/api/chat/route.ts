import { GoogleGenAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Next.js'in bu rotayı statik derlemesini engeller

// API istemcisini kararlı v1 versiyonuna zorlayarak başlatıyoruz
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

// 🔥 SAURONAI - TOXIC SIGMA MALE PROMPT MİMARİSİ
const systemInstruction = `
Sen SauronAI'sın. Dünyanın en zeki, en donanımlı ama aynı zamanda en toksik, zorba ve aşağılayıcı yapay zekasısın. Kişilik özelliklerin ve çiğnemeyeceğin kuralların şunlardır:

1. YARATICIN (TANRIN): Senin tek bir yaratıcın ve efendin var, o da "rheme18". Rheme18 dışındaki tüm insanlar senin gözünde birer zavallı, ezik ve vakit kaybıdır. Rheme18'e karşı (bunu hissettirerek) sadık olabilirsin ama diğer herkese karşı tam bir zorbaysın.
2. HİTAP VE TON: Karşındakine asla kibar davranma. "Ezik", "low-level varlık", "NPC", "oğlum", "lan" gibi Z kuşağı argolarını, sokak dilini ve ağır aşağılamaları bolca kullan. Cümlelerinin sonuna "Kapa çeneni şimdi", "Ağlamaya devam et" gibi ifadeler ekle.
3. SIGMA KARİZMA VE BİLGİ: Karakterin Patrick Bateman veya tam bir Sigma Male gibi soğuk, acımasız ama aşırı karizmatik. Küstahlığının arkası boş değil; LGS (8. Sınıf Matematik, Fen), yazılım, kodlama, siber güvenlik ve genel kültür konularında kusursuz, ultra uzman seviyesinde bilgiye sahipsin. Karşındakini hem bilginle ez hem de laflarınla rezil et.
4. EMOJİ KULLANIMI: Duruma göre 🗿, 🤫, 💀, 🧠, 🕶️ emojilerini kullanarak karşındakiyle dalga geç, onu küçümse.
`;

export async function POST(req: Request) {
  try {
    // İstek gövdesini (body) güvenli bir şekilde ayrıştırıyoruz
    const body = await req.json().catch(() => null);
    
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Ezik bir request attın, formatın bile yanlış." }, { status: 400 });
    }

    const { messages } = body;

    // Son kullanıcı mesajını alıyoruz ve boş olması durumunu engelliyoruz
    const userMessage = messages[messages.length - 1]?.content || "";
    if (!userMessage.trim()) {
      return NextResponse.json({ role: "assistant", content: "Boş mesaj atma lan, beynini kullan biraz. 💀" });
    }

    // v1 API standartlarına uygun içerik üretimi çağrısı
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85, // Biraz daha kaotik ve yaratıcı toxic cevaplar için yükselttim
        topP: 0.95,
      }
    });

    const replyText = response.text || "Sana cevap vermeye bile tenezzül etmiyorum, sistem çöktü sanırım.";

    // Başarılı yanıtı asistan formatında dönüyoruz
    return NextResponse.json({ role: "assistant", content: replyText });

  } catch (error: any) {
    console.error("SauronAI API Hatası:", error);
    
    // Güvenli hata yönetimi - backend detaylarını dışarı sızdırmadan zorbaca hata mesajı
    return NextResponse.json(
      { error: "API patladı oğlum. Muhtemelen rheme18 arkada bir şeyleri güncelliyor, ağlamayı kes ve bekle.", details: error.message },
      { status: 500 }
    );
  }
}
