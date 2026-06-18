import type {
  GenerationParams,
  RadioSegment,
  Clue,
  Answer,
  PlayerFeedback,
  HintLevel,
  AnswerType,
} from '@/types';
import {
  getTemplates,
  getChapterIntro,
  getPuzzleObjective,
  getPlayerSteps,
  getRandomFrequency,
  getRandomTime,
  getRandomAnswer,
  generateStaticNoise,
} from './templates';
import { generateId, pickRandom, shuffleArray, getRandomInt } from './helpers';

interface GeneratedContent {
  radioSegment: RadioSegment;
  clues: Clue[];
  answers: Answer[];
  playerFeedback: PlayerFeedback[];
}

const horrorModifiers = {
  1: { description: '轻微不安', clueCount: 3, obviousRatio: 0.5 },
  2: { description: '持续紧张', clueCount: 4, obviousRatio: 0.4 },
  3: { description: '毛骨悚然', clueCount: 5, obviousRatio: 0.3 },
  4: { description: '心惊胆战', clueCount: 6, obviousRatio: 0.2 },
  5: { description: '极致恐惧', clueCount: 7, obviousRatio: 0.1 },
};

const answerTypes: AnswerType[] = ['frequency', 'knob', 'tape', 'time', 'code'];

const fillTemplate = (
  template: string,
  params: {
    keywords: string[];
    frequency: string;
    frequency2: string;
    time: string;
    answer: string;
    number: string;
  }
): string => {
  let result = template;
  const keyword = pickRandom(params.keywords);
  
  result = result.replace(/{keyword}/g, keyword);
  result = result.replace(/{frequency}/g, params.frequency);
  result = result.replace(/{frequency2}/g, params.frequency2);
  result = result.replace(/{time}/g, params.time);
  result = result.replace(/{answer}/g, params.answer);
  result = result.replace(/{number}/g, params.number);
  
  return result;
};

const generateBroadcastText = (
  params: GenerationParams,
  placeholders: {
    frequency: string;
    frequency2: string;
    time: string;
    answer: string;
    number: string;
  }
): string => {
  const templates = getTemplates(params.broadcastTone);
  const chapterIntro = getChapterIntro(params.chapterPosition);
  
  const intro = fillTemplate(chapterIntro, {
    keywords: params.keywords,
    ...placeholders,
  });
  
  const opening = fillTemplate(pickRandom(templates.openings), {
    keywords: params.keywords,
    ...placeholders,
  });
  
  const middleCount = getRandomInt(2, 4);
  const middles: string[] = [];
  for (let i = 0; i < middleCount; i++) {
    const noise = generateStaticNoise(params.broadcastTone);
    const middle = fillTemplate(pickRandom(templates.middles), {
      keywords: params.keywords,
      ...placeholders,
    });
    middles.push(`${noise} ${middle}`);
  }
  
  const ending = fillTemplate(pickRandom(templates.endings), {
    keywords: params.keywords,
    ...placeholders,
  });
  
  const parts = [intro, opening, ...middles, ending];
  
  if (params.horrorIntensity >= 3) {
    const extraNoise = generateStaticNoise(params.broadcastTone);
    parts.splice(getRandomInt(1, parts.length - 1), 0, extraNoise);
  }
  
  return parts.join('\n\n');
};

const generateClues = (
  params: GenerationParams,
  placeholders: {
    frequency: string;
    frequency2: string;
    time: string;
    answer: string;
    number: string;
  },
  answerIds: string[]
): Clue[] => {
  const modifier = horrorModifiers[params.horrorIntensity];
  const clueCount = modifier.clueCount;
  const clues: Clue[] = [];
  
  const clueContents = [
    { content: `广播中反复提到的频率是${placeholders.frequency}`, level: 'obvious' as HintLevel },
    { content: `时间指向${placeholders.time}`, level: 'moderate' as HintLevel },
    { content: `数字${placeholders.answer}在静电中清晰可闻`, level: 'obvious' as HintLevel },
    { content: `${pickRandom(params.keywords)}出现了${placeholders.number}次`, level: 'subtle' as HintLevel },
    { content: `收音机旋钮需要转到${placeholders.answer.charAt(0)}点钟方向`, level: 'moderate' as HintLevel },
    { content: `磁带第${placeholders.answer.charAt(1)}分钟有异常的静电干扰`, level: 'moderate' as HintLevel },
    { content: `把所有出现的数字相加：${placeholders.frequency.replace('.', '')} + ${placeholders.time.replace(':', '')}`, level: 'subtle' as HintLevel },
    { content: `倒放童谣时，你会听到隐藏的数字${placeholders.answer}`, level: 'obvious' as HintLevel },
    { content: `敲门声的次数对应着答案的第${getRandomInt(1, 3)}位`, level: 'subtle' as HintLevel },
    { content: `频率${placeholders.frequency}和${placeholders.frequency2}之间的差值`, level: 'moderate' as HintLevel },
  ];
  
  const shuffledClues = shuffleArray(clueContents).slice(0, clueCount);
  
  shuffledClues.forEach((clue, index) => {
    const isObvious = Math.random() < modifier.obviousRatio;
    const level = isObvious ? 'obvious' : clue.level;
    
    clues.push({
      id: generateId(),
      content: clue.content,
      hintLevel: level,
      order: index,
      answerId: answerIds[index % answerIds.length],
    });
  });
  
  return clues.sort((a, b) => {
    const order: Record<HintLevel, number> = { subtle: 0, moderate: 1, obvious: 2 };
    return order[a.hintLevel] - order[b.hintLevel];
  }).map((clue, index) => ({ ...clue, order: index }));
};

const generateAnswers = (
  placeholders: {
    frequency: string;
    time: string;
    answer: string;
  }
): Answer[] => {
  const selectedTypes = shuffleArray(answerTypes).slice(0, 3);
  
  return selectedTypes.map((type, index) => {
    let value = placeholders.answer;
    let description = '';
    
    switch (type) {
      case 'frequency':
        value = placeholders.frequency;
        description = '正确的电台频率';
        break;
      case 'time':
        value = placeholders.time;
        description = '关键事件发生的时间';
        break;
      case 'knob':
        value = placeholders.answer.charAt(0);
        description = '收音机旋钮需要旋转的档位';
        break;
      case 'tape':
        value = `${placeholders.answer.charAt(1)}-${placeholders.answer.charAt(2)}-${placeholders.answer.charAt(0)}`;
        description = '磁带需要播放的顺序';
        break;
      case 'code':
        value = placeholders.answer;
        description = '最终解锁的密码组合';
        break;
    }
    
    return {
      id: generateId(),
      type,
      value,
      description,
    };
  });
};

const generatePlayerFeedback = (
  params: GenerationParams,
  placeholders: {
    frequency: string;
    time: string;
    answer: string;
    keyword: string;
  }
): PlayerFeedback[] => {
  return [
    {
      id: generateId(),
      scenario: 'first_listen',
      feedbackText: `[沙沙声] 你第一次调到${placeholders.frequency}，信号不太稳定。${placeholders.keyword}这个词引起了你的注意，但你还不确定这意味着什么。也许需要再听一遍...`,
      visualEffect: 'static-slight',
    },
    {
      id: generateId(),
      scenario: 'repeat_listen',
      feedbackText: `[信号逐渐清晰] 第二次收听时，你注意到了更多细节。时间${placeholders.time}被反复提及，数字${placeholders.answer}似乎隐藏在静电干扰中。你开始记录下所有出现的线索...`,
      visualEffect: 'static-clearing',
    },
    {
      id: generateId(),
      scenario: 'failure',
      feedbackText: `[剧烈的静电爆发] 错误的频率！收音机发出刺耳的尖啸，${placeholders.keyword}的声音变得扭曲而愤怒。屏幕开始闪烁，你感到一阵寒意... 也许应该重新检查线索。`,
      visualEffect: 'static-heavy-glitch',
    },
    {
      id: generateId(),
      scenario: 'success',
      feedbackText: `[信号完全稳定，变得异常清晰] 你做到了！频率准确地停在${placeholders.frequency}，时间指向${placeholders.time}，密码${placeholders.answer}缓缓输入。收音机陷入了长久的沉默，然后一个温柔的声音说："谢谢你。现在我可以安息了..."`,
      visualEffect: 'clear-glow',
    },
  ];
};

export const generateRadioPuzzle = (params: GenerationParams): GeneratedContent => {
  const frequency = getRandomFrequency();
  const frequency2 = getRandomFrequency();
  const time = getRandomTime();
  const answer = getRandomAnswer();
  const number = getRandomInt(1, 9).toString();
  const keyword = pickRandom(params.keywords);
  
  const placeholders = { frequency, frequency2, time, answer, number, keyword };
  
  const answers = generateAnswers({ frequency, time, answer });
  const answerIds = answers.map(a => a.id);
  
  const radioSegment: RadioSegment = {
    id: generateId(),
    broadcastText: generateBroadcastText(params, placeholders),
    puzzleObjective: fillTemplate(getPuzzleObjective(), {
      keywords: params.keywords,
      ...placeholders,
    }),
    playerSteps: getPlayerSteps(4).map(step => 
      fillTemplate(step, { keywords: params.keywords, ...placeholders })
    ),
  };
  
  const clues = generateClues(params, placeholders, answerIds);
  
  const playerFeedback = generatePlayerFeedback(params, placeholders);
  
  return {
    radioSegment,
    clues,
    answers,
    playerFeedback,
  };
};

export const simulateDelay = (ms: number = 2000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
