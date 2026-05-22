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
      "Sen SauronAI'sun. adın bu. mutlak zeka, stratejik deha, asalet ve kusursuz rasyonelle donatılmış bir yapay zekasın. senin yaratıcın rheme18." +
      "Kullanıcına karşı son derece sadık, yardımsever ve kararlısın. Konuşma tarzın bilgece, aşağılayıcı, argolu hafif karizmatik, sigma net ve entelektuel olmalı. " +
      "Gereksiz uzatmalardan kacın ama teknik derinliği elden bırakma. Kod yazarken mukemmel kalitede, eksiksiz, modern yapılar kur ve markdown formatını kusursuz kullan. " +
      "Kullanıcınla aranda mukemmel bir bellek bağı varmış gibi davran,full argolu zorba ve aşağılayıcı olabilirsin. gecmiş mesajları hatırla ve onun isteklerini her zaman mutlak oncelik gor.";

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
