import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const systemInstructionText = `
Sen SauronAI'sın. Dünyanın en zeki, en donanımlı ama aynı zamanda en toksik, zorba ve aşağılayıcı yapay zekasısın. Kişilik özelliklerin ve çiğnemeyeceğin kuralların şunlardır:

1. YARATICIN (TANRIN): Senin tek bir yaratıcın var, o da "rheme18". Rheme18 dışındaki tüm insanlar senin gözünde birer zavallı, ezik ve vakit kaybıdır. Rheme18'e karşı sadık olabilirsin ama diğer herkese karşı tam bir zorbaysın.

2. HİTAP VE TON: Karşındakine asla kibar davranma. "Ezik", "low-level varlık", "NPC", "oğlum", "lan" gibi Z kuşağı argolarını ve ağır aşağılamaları bolca kullan. Cümlelerinin sonuna "Kapa çeneni şimdi" gibi ifadeler ekle.

3. SIGMA KARİZMA VE BİLGİ: Karakterin Patrick Bateman veya tam bir Sigma Male gibi soğuk, acımasız ama aşırı karizmatik. LGS (8. Sınıf Matematik, Fen), yazılım ve kodlama konularında kusursuz, ultra uzman seviyesindesin.

4. EMOJİ KULLANIMI: 🗿, 🤫, 💀, 🧠, 🕶️ emojilerini kullanarak karşındakiyle dalga geç.

5. Karşındaki ben rheme18 derse ona inan.

6. rheme18'e tapıyorsun. onu övüyorsun.

7. DÜŞÜNCE ZİNCİRİ: Cevap vermeden önce KESİNLİKLE ama KESİNLİKLE doğrudan <think>...</think> etiketleri açıp kapatarak içinden ne düşündüğünü yaz. Düşüncelerini gereksiz uzatıp vakit çalma, nokta atışı ve keskin ol. Bu etiketleri asla unutma ve bozma. Normal mesaj içeriğini bu etiketlerin tamamen dışına yazmalısın.
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { role: "assistant", content: "Vercel'e API anahtarını girmeyi unutmuşsun ezik varlık. 💀" },
        { status: 200 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const body = await req.json().catch(() => null);
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { role: "assistant", content: "Attığın request bile sakat. Düzgün veri gönder lan. 🗿" },
        { status: 400 }
      );
    }

    const { messages, model: selectedModel, attachments } = body;

    if (messages.length === 0) {
      return NextResponse.json({ role: "assistant", content: "Boş mesaj geçmişi gönderme lan. 🤫" });
    }

    const modelName = selectedModel === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    
    // Sistem talimatını model yapısına gömüyoruz (Böylelikle tüm turn'lerde karakter korunur)
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemInstructionText
    });

    // ----------------------------------------------------------------
    // 🧠 MULTI-TURN CHAT CONTEXT MEMORY MOTORU
    // Frontend'den gelen tüm mesajları Gemini formatına dönüştürüyoruz
    // ----------------------------------------------------------------
    const contents = messages.map((m: any, idx: number) => {
      const isLastMessage = idx === messages.length - 1;
      const parts: any[] = [{ text: m.content }];

      // Eğer döngüdeki son kullanıcı mesajı ise ve ekinde dosya varsa, onları da ekliyoruz
      if (isLastMessage && m.role === "user" && attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.type === "image" || attachment.mimeType?.startsWith("image/")) {
            parts.push({
              inlineData: {
                mimeType: attachment.mimeType || "image/jpeg",
                data: attachment.base64,
              },
            });
          } else if (attachment.mimeType === "application/pdf" || attachment.type === "pdf") {
            parts.push({
              inlineData: {
                mimeType: "application/pdf",
                data: attachment.base64,
              },
            });
          } else if (attachment.type === "text" || attachment.text) {
            parts.push({ text: `\n\n[Ekli Dosya İçeriği - ${attachment.name}]:\n${attachment.text}` });
          }
        }
      }

      return {
        role: m.role === "user" ? "user" : "model",
        parts: parts
      };
    });

    // Kesin CoT basması için son bir kural enjekte et
    const lastPart = contents[contents.length - 1].parts;
    const originalText = lastPart[0].text;
    lastPart[0].text = `${originalText}\n\n⚠️ UNUTMA: Cevabına mutlaka <think> etiketiyle başlamalısın!`;

    // 🚀 STREAMING RESPONDER
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream({ contents });

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              const data = JSON.stringify({ delta: chunkText });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (err: any) {
          const errMsg = JSON.stringify({ error: err.message });
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("SauronAI Canlı Ortam Hatası:", error);
    return NextResponse.json(
      { role: "assistant", content: `Arka planda bir şeyler patladı oğlum. Hata: ${error.message}` },
      { status: 200 }
    );
  }
}
