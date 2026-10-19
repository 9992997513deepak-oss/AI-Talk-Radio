import { GoogleGenAI } from '@google/genai';
import { buildScriptPrompt } from '@/lib/prompts';
import { GenerateShowRequest, ScriptDialogueLine } from '@/types/radio';

interface InteractionStepContent {
  text?: string;
  [key: string]: unknown;
}

interface InteractionStep {
  content?: InteractionStepContent[];
  [key: string]: unknown;
}

interface InteractionResult {
  steps?: InteractionStep[];
  text?: string;
  [key: string]: unknown;
}

export async function generateRadioScript(req: GenerateShowRequest): Promise<{ script: string; dialogue: ScriptDialogueLine[]; wordCount: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = buildScriptPrompt(
    req.topic,
    req.duration,
    req.language,
    req.format || 'Real FM Radio Talk Show',
    req.tone,
    req.hosts,
    req.instructions,
    req.targetAudience
  );

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      let scriptText = '';

      try {
        const interaction = (await ai.interactions.create({
          model: 'gemini-3-flash-preview',
          input: prompt,
        })) as unknown as InteractionResult;

        if (interaction.steps && interaction.steps.length > 0) {
          const lastStep = interaction.steps[interaction.steps.length - 1];
          if (lastStep.content && lastStep.content.length > 0) {
            scriptText = lastStep.content[0].text || '';
          }
        }
        if (!scriptText && interaction.text) {
          scriptText = interaction.text;
        }
      } catch (interError) {
        console.warn('Interactions API script generation failed, trying generateContent fallback:', interError);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        scriptText = response.text || '';
      }

      if (scriptText && scriptText.trim().length > 50) {
        const wordCount = scriptText.trim().split(/\s+/).length;
        const dialogue = parseScriptDialogue(scriptText, req.hosts);
        return { script: scriptText, dialogue, wordCount };
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to smart radio script builder:', err);
    }
  }

  return generateFallbackScript(req);
}

export function parseScriptDialogue(scriptText: string, hosts?: GenerateShowRequest['hosts']): ScriptDialogueLine[] {
  const lines = scriptText.split('\n');
  const dialogue: ScriptDialogueLine[] = [];
  const maleName = hosts?.maleHost?.name || 'Aryan';
  const femaleName = hosts?.femaleHost?.name || 'Ananya';

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;

    if ((line.startsWith('[') && line.endsWith(']')) || line.toLowerCase().includes('music cue') || line.toLowerCase().includes('sfx:')) {
      dialogue.push({
        id: `line_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        speaker: 'CUE',
        speakerGender: 'cue',
        text: '',
        cue: line,
      });
      return;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && colonIndex < 35) {
      const speakerRaw = line.substring(0, colonIndex).trim();
      const text = line.substring(colonIndex + 1).trim();

      let speakerGender: 'male' | 'female' = 'male';
      const isFemale =
        speakerRaw.toLowerCase().includes('female') ||
        speakerRaw.toLowerCase().includes('ananya') ||
        speakerRaw.toLowerCase().includes('co-host') ||
        speakerRaw.toLowerCase().includes(femaleName.toLowerCase());

      if (isFemale) {
        speakerGender = 'female';
      }

      dialogue.push({
        id: `line_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        speaker: speakerRaw,
        speakerGender,
        text,
        status: 'pending',
      });
    } else {
      dialogue.push({
        id: `line_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        speaker: `${maleName} (Male Host)`,
        speakerGender: 'male',
        text: line,
        status: 'pending',
      });
    }
  });

  return dialogue;
}

function generateFallbackScript(req: GenerateShowRequest): { script: string; dialogue: ScriptDialogueLine[]; wordCount: number } {
  const maleName = req.hosts?.maleHost?.name || 'Aryan';
  const femaleName = req.hosts?.femaleHost?.name || 'Ananya';
  const topic = req.topic;
  const lang = req.language;

  let linesRaw: { speaker: string; gender: 'male' | 'female' | 'cue'; text: string; cue?: string }[] = [];

  if (lang === 'Hindi') {
    linesRaw = [
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: RADIOVERSE AI INTRO JINGLE]' },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `नमस्कार दोस्तों! RadioVerse AI पर आपका स्वागत है। मैं हूं आपका होस्ट ${maleName}।` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `और मैं हूं ${femaleName}! आज का एपिसोड बेहद खास है क्योंकि आज हम चर्चा कर रहे हैं - "${topic}"।` },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `बिल्कुल ${femaleName}! "${topic}" एक ऐसा विषय है जो आजकल हर तरफ छाया हुआ है और लोग इसके बारे में गहराई से जानना चाहते हैं।` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `सही कहा ${maleName}। सबसे दिलचस्प बात यह है कि इसके कई ऐसे पहलू हैं जिन पर आम तौर पर ध्यान नहीं जाता।` },
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: AMBIENT TALK BEAT]' },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `अगर हम इसके मुख्य फायदों और चुनौतियों को समझें, तो भविष्य की दिशा और स्पष्ट हो जाती है।` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `बिल्कुल! हमारे श्रोताओं के लिए यह जानना बहुत जरूरी है कि वे इसका सही इस्तेमाल कैसे कर सकते हैं।` },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `तो दोस्तों, यह था आज का विशेष सेगमेंट। अगर आपको यह चर्चा पसंद आई तो चैनल को जरूर सब्सक्राइब करें!` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `सुनते रहिए RadioVerse AI! मिलेंगे अगले एपिसोड में, तब तक के लिए टेक केयर!` },
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: RADIOVERSE AI OUTRO JINGLE]' },
    ];
  } else if (lang === 'Hinglish') {
    linesRaw = [
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: UPBEAT RADIO JINGLE]' },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `Hey everyone! Welcome back to RadioVerse AI! Main hoon aapka host ${maleName}.` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `And main hoon ${femaleName}! Today's episode is super exciting because hum decode kar rahe hain "${topic}"!` },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `Totally ${femaleName}! "${topic}" ke baare mein aaj kal har koi baat kar raha hai.` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `Bilkul! Aur sabse interesting part ye hai ki iske piche ka science and impact bohot deep hai.` },
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: SOFT CHILL BEAT]' },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `Exactly! Is episode mein hum saare key insights and practical takeaways easy language mein samjhenge.` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `Right! Toh friends, bane rahiye humare saath takil aap koi bhi important point miss na karein.` },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `That's a wrap for today's quick episode on "${topic}". Don't forget to like and subscribe!` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `Keep listening to RadioVerse AI! See you in the next episode!` },
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: OUTRO JINGLE]' },
    ];
  } else {
    linesRaw = [
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: BROADCAST INTRO JINGLE]' },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `Welcome back to RadioVerse AI! I'm your host ${maleName}.` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `And I'm ${femaleName}! Today we are diving into an extraordinary topic: "${topic}".` },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `That's right ${femaleName}. "${topic}" is shaping industries and daily conversations around the globe.` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `What makes this so compelling is the blend of innovation and real-world application.` },
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: AMBIENT RADIO TRACK]' },
      { speaker: `${maleName} (Male Host)`, gender: 'male', text: `Over this episode, we'll break down the key takeaways and actionable insights.` },
      { speaker: `${femaleName} (Female Host)`, gender: 'female', text: `Thank you all for tuning in! Don't forget to hit subscribe for more daily radio shows.` },
      { speaker: 'CUE', gender: 'cue', text: '', cue: '[MUSIC CUE: BROADCAST OUTRO]' },
    ];
  }

  const targetLinesCount = Math.max(linesRaw.length, req.duration * 6);
  const extendedLines = [...linesRaw];
  while (extendedLines.length < targetLinesCount) {
    const isMale = extendedLines.length % 2 === 0;
    const speaker = isMale ? `${maleName} (Male Host)` : `${femaleName} (Female Host)`;
    const text = isMale
      ? `Is topic par ek aur important aspect ye hai ki technology aur user habits constantly change ho rahe hain.`
      : `Bilkul! Aur is change ko adopt karna sabse badi smartness hai.`;
    extendedLines.splice(extendedLines.length - 2, 0, {
      speaker,
      gender: isMale ? 'male' : 'female',
      text,
    });
  }

  const dialogue: ScriptDialogueLine[] = extendedLines.map((item, idx) => ({
    id: `line_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    speaker: item.speaker,
    speakerGender: item.gender,
    text: item.text,
    cue: item.cue,
    status: 'pending',
  }));

  const script = dialogue
    .map((d) => (d.cue ? d.cue : `${d.speaker}: ${d.text}`))
    .join('\n');

  const wordCount = script.trim().split(/\s+/).length;

  return { script, dialogue, wordCount };
}
