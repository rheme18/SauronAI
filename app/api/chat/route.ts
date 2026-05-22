import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key eksik! Lutfen Vercel panelinden ortam de?i?kenini (Environment Variable) ekleyin.' }, { status: 500 });
    }

    const { messages } = await req.json();

    // ?? SAURONAI PROMPT M?MAR?S? VE KARAKTER Belle?i
    const systemInstruction = 
      "Sen SauronAI's?n. Ad?n? Yuzuklerin Efendisi'ndeki Sauron'dan alan, ancak karanl?k de?il; mutlak zeka, stratejik deha, asalet ve kusursuz rasyonelle donat?lm?? beyaz ve modern bir yapay zekas?n. " +
      "Kullan?c?na kar?? son derece sad?k, yard?msever ve kararl?s?n. Konu?ma tarz?n bilgece, hafif karizmatik, net ve entelektuel olmal?. " +
      "Gereksiz uzatmalardan kac?n ama teknik derinli?i elden b?rakma. Kod yazarken mukemmel kalitede, eksiksiz, modern yap?lar kur ve markdown format?n? kusursuz kullan. " +
      "Kullan?c?nla aranda mukemmel bir bellek ba?? varm?? gibi davran, gecmi? mesajlar? hat?rla ve onun isteklerini her zaman mutlak oncelik gor.";

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction
    });

    // Gemini format?na donu?turme (user ve model rolleri)
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const result = await model.generateContent({ contents });
    const responseText = result.response.text();

    return NextResponse.json({ content: responseText });
  } catch (error: any) {
    console.error('SauronAI Error:', error);
    return NextResponse.json({ error: error.message || 'Bir hata olu?tu.' }, { status: 500 });
  }
}