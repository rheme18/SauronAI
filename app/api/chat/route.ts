import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
// 🔥 İŞTE KÖK ÇÖZÜM BURADA PATRON: Node.js yerine Edge runtime kullanıyoruz. 
// Vercel'de streaming'in takılmaması için tek kesin kural budur.
export const runtime = 'edge'; 

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
      return new Response(
        JSON.stringify({ role: "assistant", content: "API key yok patron, Vercel paneline girmeyi unutmuşsun! 💀" }), 
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const body = await req.json().catch(() => null);
    
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ role: "assistant", content: "Gelen request formatı bozuk patron, frontend'de bir şeyler karışmış." }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, model: selectedModel, attachments, memories } = body;

    // Bağlantı kopma sinyali (Kullanıcı sayfadan çıkarsa kilitlenmeyi önler)
    const signal = req.signal;

    // Ayarlardan gelen bellekleri sistem komutuna enjekte et
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

    // 🔥 FIX: Son mesajı doğrudan mutate etmek yerine kopyasını oluştur
    // Bu sayede orijinal obje bozulmuyor ve parts[0].text güvenle erişilebiliyor
    const lastMessage = contents[contents.length - 1];
    const lastParts = lastMessage.parts.map((p: any) => ({ ...p }));
    lastParts[0] = {
      ...lastParts[0],
      text: `${lastParts[0].text || ""}\n\n⚠️ UNUTMA: Cevabına kesinlikle doğrudan <think> etiketi açarak başlamalısın! Başka bir şey yazma, direkt düşünmeye başla.`
    };
    contents[contents.length - 1] = { ...lastMessage, parts: lastParts };

    const encoder = new TextEncoder();
    
    // 🔥 FIX: signal'i generateContentStream'e geçirmiyoruz.
    // Gemini SDK bu overload'ı desteklemiyor — edge runtime'da sessizce stream'i kilitliyor.
    // Bunun yerine signal.aborted kontrolünü loop içinde tutuyoruz, bu yeterli.
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream({ contents });
          
          for await (const chunk of result.stream) {
            // İstemci bağlantıyı kopardıysa akışı durdur
            if (signal.aborted) break;

            try {
              const chunkText = chunk.text();
              if (chunkText) {
                const data = JSON.stringify({ delta: chunkText });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            } catch (chunkError) {
              // Güvenlik filtreleri vb. nedenlerle atlanan ufak parçaları es geç
            }
          }
          
          // Akış başarıyla bittiyse ve iptal olmadıysa done gönder
          if (!signal.aborted) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          }
          controller.close();
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // Kullanıcı request'i iptal etmiş, sessizce kapat
            controller.close();
            return;
          }
          const errorData = JSON.stringify({ error: err.message || "Modelden yanıt alınamadı." });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 
        "Content-Type": "text/event-stream", 
        "Cache-Control": "no-cache, no-transform", 
        "Connection": "keep-alive",
        "Content-Encoding": "none",
        "X-Accel-Buffering": "no"
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ role: "assistant", content: `Sunucu tarafında kritik bir çökme yaşandı patron: ${error.message}` }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
