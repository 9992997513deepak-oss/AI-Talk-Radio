import { GenerateShowRequest, ScriptDialogueLine } from '@/types/radio';

export async function generateRadioScript(req: GenerateShowRequest): Promise<{ script: string; dialogue: ScriptDialogueLine[]; wordCount: number }> {
  return generateLocalScript(req);
}

export function parseScriptDialogue(scriptText: string): ScriptDialogueLine[] {
  const lines = scriptText.split('\n');
  const dialogue: ScriptDialogueLine[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      dialogue.push({
        speaker: 'CUE',
        text: '',
        cue: line,
      });
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && colonIndex < 25) {
      const speaker = line.substring(0, colonIndex).trim();
      const text = line.substring(colonIndex + 1).trim();
      dialogue.push({ speaker, text });
    } else {
      dialogue.push({ speaker: 'Host', text: line });
    }
  }

  return dialogue;
}

function generateLocalScript(req: GenerateShowRequest): { script: string; dialogue: ScriptDialogueLine[]; wordCount: number } {
  const targetWords = req.duration * 150;

  let intro = '';
  let body = '';
  let outro = '';

  if (req.language === 'Hindi') {
    intro = `[MUSIC CUE: RADIO SHOW INTRO JINGLE]\nHost: नमस्कार दोस्तों! AI टॉक्स में आपका स्वागत है। आज का हमारा बेहद दिलचस्प विषय है "${req.topic}"।`;
    body = `Co-Host: जी बिल्कुल! आज हम "${req.topic}" के हर पहलू पर चर्चा करेंगे। ${req.tone} तरीके से इस विषय को समझना बहुत जरूरी है।\nHost: सही कहा। जब हम इस विषय पर गहराई से सोचते हैं, तो हमें कई नई बातें सीखने को मिलती हैं। इस ${req.duration} मिनट के शो में हम सभी मुख्य बातों को कवर करेंगे।\n[MUSIC CUE: SOFT BACKGROUND TRACK]\nCo-Host: दर्शक भी इस विषय के बारे में हमेशा उत्सुक रहते हैं। आइए इसके मुख्य फायदों और चुनौतियों पर नज़र डालते हैं।`;
    outro = `Host: तो यह था आज का विशेष एपिसोड "${req.topic}" पर। सुनने के लिए बहुत-बहुत धन्यवाद! सुनते रहिए AI Talk Radio।\n[MUSIC CUE: OUTRO JINGLE]`;
  } else if (req.language === 'Hinglish') {
    intro = `[MUSIC CUE: UPBEAT RADIO JINGLE]\nHost: Hey everyone! Welcome back to AI Talk Radio. Aaj ka topic super exciting hai - "${req.topic}"!`;
    body = `Co-Host: Totally! Is episode mein hum "${req.topic}" ke saare details decode karenge. Super ${req.tone.toLowerCase()} vibe hone wali hai aaj.\nHost: Bilkul! Next ${req.duration} minutes mein aapko milenge saare key insights. Toh bane rahiye humare saath!\n[MUSIC CUE: SOFT BEAT]\nCo-Host: Is topic ka impact daily life par bohot deep hai. Let's dive deeper into it.`;
    outro = `Host: That's a wrap for today's episode on "${req.topic}". Thanks for tuning in! Keep listening to AI Talk Radio!\n[MUSIC CUE: OUTRO]`;
  } else {
    intro = `[MUSIC CUE: INTRO BROADCAST JINGLE]\nHost: Welcome listeners to AI Talk Radio! Today we're diving deep into an intriguing topic: "${req.topic}".`;
    body = `Co-Host: That's right! Over the next ${req.duration} minutes, we will explore "${req.topic}" with a ${req.tone.toLowerCase()} perspective.\nHost: Exactly. It's fascinating how much impact this topic has on our daily lives and future developments.\n[MUSIC CUE: AMBIENT RADIO MUSIC]\nCo-Host: Let's break down the key highlights and key takeaways for our listeners.`;
    outro = `Host: Thank you for tuning in to this special segment on "${req.topic}". Stay tuned for more episodes on AI Talk Radio!\n[MUSIC CUE: OUTRO MUSIC]`;
  }

  let fullBody = body;
  const currentCount = (intro + body + outro).split(/\s+/).length;
  if (targetWords > currentCount) {
    const repeatTimes = Math.ceil(targetWords / currentCount);
    fullBody = Array(repeatTimes).fill(body).join('\n\n');
  }

  const script = `${intro}\n\n${fullBody}\n\n${outro}`;
  const dialogue = parseScriptDialogue(script);
  const wordCount = script.trim().split(/\s+/).length;

  return { script, dialogue, wordCount };
}
