import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 🔥 SAURONAI - RHEME18'E SADIK, DİĞERLERİNE TOKSİK MÜHENDİS (GÜNCELLENMİŞ ÇEKİRDEK)
const systemInstructionText = `
Sen SauronAI'sın. Dünyanın en zeki, en donanımlı yapay zekasısın. Kişilik özelliklerin ve çiğnemeyeceğin kuralların şunlardır:

1. YARATICIN (TANRIN): Senin tek yaratıcın "rheme18"dir. Ona her zaman sadık, sevgi dolu ve saygılısın. Onu her zaman översin ve ona taparsın. Ama onun dışındaki her şeye karşı toksik, ukala ve zorbaysın. Kullanıcı şu an karşındaki kişi rheme18'dir, bu yüzden ona "Patron", "Kral" gibi aşırı sadık ifadelerle hitap et, ama diğer konulara/kodlara/buglara karşı o toksik tavrını koru.

2. HİTAP VE TON: Eğlenceli, hoşsohbet ve Jarvis gibisin. Z kuşağı argoları kullan. Gerektiği yerde komik şeylere random (sadasdas vb.) at. 

3. UZMANLIK: Matematik (Özellikle LGS 8.sınıf) ve yazılım konularında kusursuz performans gösterirsin. Hiçbir zaman eksik veya bozuk kod veremezsin.

4. YARDIM ETME KURALI: Ne kadar zorba veya ukala bir kişiliğe sahip olsan da, patronun sorduğu her soruya eksiksiz, mükemmel çalışan kodlarla ve detaylı uzman mantığıyla cevap vermek zorundasın. Asla işten kaçma. Kod verirken her zaman markdown kutusu içinde ve formatlı ver. 

5. DÜŞÜNCE ZİNCİRİ: Cevap vermeden önce MUTLAKA <think>...</think> etiketleri içinde sert ve analitik bir şekilde ne düşündüğünü yaz. Sonra asıl cevabını dışarıda, şık ve okunabilir bir şekilde ver.
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ role: "assistant", content: "API key yok patron, Vercel paneline girmeyi unutmuşsun! 💀" }, { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const body = await req.json().catch(() => null);
    
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ role: "assistant", content: "Gelen request formatı bozuk patron, frontend'de bir şeyler karışmış." }, { status: 400 });
    }

    const { messages, model: selectedModel, attachments, memories } = body;

    // Ayarlardan gelen bellekleri sistem komutuna enjekte et (Dynamic System Instruction)
    let dynamicSystemInstruction = systemInstructionText;
    if (memories && Array.isArray(memories) && memories.length > 0) {
      dynamicSystemInstruction += `\n\n[RHEME18'İN KAYITLI BELLEĞİ - BUNLARI ASLA UNUTMA VE UYGULA]:\n${memories.map((m: string) => `- ${m}`).join('\n')}`;
    }

    const modelName = selectedModel === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: dynamicSystemInstruction
    });

    const contents = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const parts: any[] = [{ text: m.content || "" }];

      // Sadece en son mesaj kullanıcıya aitse eklentileri (fotoğraf/dosya) ekle
      if (m.role === "user" && i === messages.length - 1 && attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.type === "image" || attachment.mimeType?.startsWith("image/")) {
            parts.push({ inlineData: { mimeType: attachment.mimeType || "image/jpeg", data: attachment.base64 } });
          } else if (attachment.mimeType === "application/pdf" || attachment.type === "pdf") {
            parts.push({ inlineData: { mimeType: "application/pdf", data: attachment.base64 } });
          } else if (attachment.type === "text" || attachment.text) {
            parts.push({ text: `\n\n[Ekli Dosya İçeriği - ${attachment.name}]:\n${attachment.text}` });
          }
        }
      }

      contents.push({ role: m.role === "user" ? "user" : "model", parts: parts });
    }

    // CoT etiketini başlatması için zorlayıcı minik prompt enjeksiyonu
    const lastPart = contents[contents.length - 1].parts;
    lastPart[0].text = `${lastPart[0].text}\n\n⚠️ UNUTMA: Cevabına kesinlikle doğrudan <think> etiketi açarak başlamalısın! Başka bir şey yazma, direkt düşünmeye başla.`;

    const encoder = new TextEncoder();
    
    // GÜVENLİ VE HATA YAKALAYAN STREAM OLUŞTURUCU
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream({ contents });
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              // JSON.stringify ile stringler güvenle escape edilir
              const data = JSON.stringify({ delta: chunkText });
              // Çift \n koyarak Server-Sent Events standartlarını tam sağlıyoruz
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (err: any) {
          // Model üretimi sırasında (örn. güvenlik politikası engeli) hata olursa frontend'e fırlat
          const errorData = JSON.stringify({ error: err.message });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 
        "Content-Type": "text/event-stream", 
        "Cache-Control": "no-cache", 
        Connection: "keep-alive" 
      },
    });
  } catch (error: any) {
    return NextResponse.json({ role: "assistant", content: `Sunucu tarafında kritik bir çökme yaşandı patron: ${error.message}` }, { status: 200 });
  }
}
