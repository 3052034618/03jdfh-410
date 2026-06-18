import type {
  GenerationParams,
  RadioSegment,
  Clue,
  Answer,
  PlayerFeedback,
  HintLevel,
  AnswerType,
  PuzzleVersion,
  KnownInfoCategory,
} from '@/types';
import {
  getTemplates,
  getChapterIntro,
  getPuzzleObjective,
  getPlayerSteps,
  getCluePatternsByType,
  generateStaticNoise,
  getRandomFrequency,
  getRandomTime,
  getRandomAnswer,
  getKnownInfoTemplates,
  getKnownInfoCategory,
} from './templates';
import { generateId, pickRandom, shuffleArray, getRandomInt } from './helpers';
import { validateClueChain } from './validation';

interface GeneratedContent {
  radioSegment: RadioSegment;
  clues: Clue[];
  answers: Answer[];
  playerFeedback: PlayerFeedback[];
  fairnessScore: number;
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
    knownInfo?: string;
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
  if (params.knownInfo) {
    result = result.replace(/{knownInfo}/g, params.knownInfo);
  }
  
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
  
  const parts: string[] = [];
  
  const intro = fillTemplate(chapterIntro, {
    keywords: params.keywords,
    ...placeholders,
  });
  parts.push(intro);
  
  if (params.playerKnownInfo.length > 0) {
    const knownInfo = pickRandom(params.playerKnownInfo);
    const category = getKnownInfoCategory(knownInfo);
    const knownTemplates = getKnownInfoTemplates(category);
    
    if (knownTemplates.openings.length > 0) {
      const knownOpening = fillTemplate(pickRandom(knownTemplates.openings), {
        keywords: params.keywords,
        ...placeholders,
        knownInfo,
      });
      parts.push(knownOpening);
    }
  }
  
  const opening = fillTemplate(pickRandom(templates.openings), {
    keywords: params.keywords,
    ...placeholders,
  });
  parts.push(opening);
  
  const middleCount = getRandomInt(2, 4);
  const middles: string[] = [];
  
  if (params.playerKnownInfo.length > 0) {
    const knownInfo = pickRandom(params.playerKnownInfo);
    const category = getKnownInfoCategory(knownInfo);
    const knownTemplates = getKnownInfoTemplates(category);
    
    if (knownTemplates.middles.length > 0) {
      const knownMiddle = fillTemplate(pickRandom(knownTemplates.middles), {
        keywords: params.keywords,
        ...placeholders,
        knownInfo,
      });
      middles.push(knownMiddle);
    }
  }
  
  for (let i = 0; i < middleCount; i++) {
    const noise = generateStaticNoise(params.broadcastTone);
    const middle = fillTemplate(pickRandom(templates.middles), {
      keywords: params.keywords,
      ...placeholders,
    });
    middles.push(`${noise} ${middle}`);
  }
  
  const shuffledMiddles = shuffleArray(middles);
  parts.push(...shuffledMiddles);
  
  const ending = fillTemplate(pickRandom(templates.endings), {
    keywords: params.keywords,
    ...placeholders,
  });
  parts.push(ending);
  
  if (params.horrorIntensity >= 3) {
    const extraNoise = generateStaticNoise(params.broadcastTone);
    parts.splice(getRandomInt(1, parts.length - 1), 0, extraNoise);
  }
  
  return parts.join('\n\n');
};

const generateAnswers = (
  placeholders: {
    frequency: string;
    time: string;
    answer: string;
  }
): Answer[] => {
  const selectedTypes = shuffleArray(answerTypes).slice(0, 3);
  
  return selectedTypes.map((type) => {
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

const generateClues = (
  params: GenerationParams,
  placeholders: {
    frequency: string;
    frequency2: string;
    time: string;
    answer: string;
    number: string;
  },
  answers: Answer[]
): Clue[] => {
  const modifier = horrorModifiers[params.horrorIntensity];
  const clueCount = modifier.clueCount;
  const clues: Clue[] = [];
  
  const answerTypeMap: Partial<Record<AnswerType, Answer>> = {};
  answers.forEach(answer => {
    answerTypeMap[answer.type] = answer;
  });
  
  const cluePool: { content: string; level: HintLevel; answerType: AnswerType }[] = [];
  
  answers.forEach(answer => {
    const patterns = getCluePatternsByType(answer.type);
    patterns.forEach(pattern => {
      let content = pattern.pattern;
      const keyword = pickRandom(params.keywords);
      const number = getRandomInt(1, 9).toString();
      
      content = content.replace(/{keyword}/g, keyword);
      content = content.replace(/{frequency}/g, placeholders.frequency);
      content = content.replace(/{frequency2}/g, placeholders.frequency2);
      content = content.replace(/{time}/g, placeholders.time);
      content = content.replace(/{answer}/g, answer.value);
      content = content.replace(/{number}/g, number);
      
      cluePool.push({
        content,
        level: pattern.hintLevel,
        answerType: answer.type,
      });
    });
  });
  
  const shuffledPool = shuffleArray(cluePool);
  const selectedClues: typeof cluePool = [];
  
  answers.forEach(answer => {
    const typeClue = shuffledPool.find(c => c.answerType === answer.type && !selectedClues.includes(c));
    if (typeClue) {
      selectedClues.push(typeClue);
    }
  });
  
  const remainingClues = shuffledPool.filter(c => !selectedClues.includes(c));
  selectedClues.push(...remainingClues.slice(0, clueCount - selectedClues.length));
  
  selectedClues.forEach((clue, index) => {
    const answer = answerTypeMap[clue.answerType];
    const isObvious = Math.random() < modifier.obviousRatio;
    const level: HintLevel = isObvious ? 'obvious' : clue.level;
    
    clues.push({
      id: generateId(),
      content: clue.content,
      hintLevel: level,
      order: index,
      answerId: answer?.id,
      answerType: clue.answerType,
      relatedStep: index,
    });
  });
  
  return clues.sort((a, b) => {
    const order: Record<HintLevel, number> = { subtle: 0, moderate: 1, obvious: 2 };
    return order[a.hintLevel] - order[b.hintLevel];
  }).map((clue, index) => ({ ...clue, order: index, relatedStep: index }));
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
  const feedback: PlayerFeedback[] = [];
  
  let firstListenText = `[沙沙声] 你第一次调到${placeholders.frequency}，信号不太稳定。${placeholders.keyword}这个词引起了你的注意，但你还不确定这意味着什么。也许需要再听一遍...`;
  
  if (params.playerKnownInfo.length > 0) {
    const knownInfo = pickRandom(params.playerKnownInfo);
    firstListenText += `\n\n你想起了${knownInfo}... 这之间会有联系吗？`;
  }
  
  feedback.push({
    id: generateId(),
    scenario: 'first_listen',
    feedbackText: firstListenText,
    visualEffect: 'static',
  });
  
  let repeatListenText = `[信号逐渐清晰] 第二次收听时，你注意到了更多细节。时间${placeholders.time}被反复提及，数字${placeholders.answer}似乎隐藏在静电干扰中。你开始记录下所有出现的线索...`;
  
  feedback.push({
    id: generateId(),
    scenario: 'repeat_listen',
    feedbackText: repeatListenText,
    visualEffect: 'flicker',
  });
  
  feedback.push({
    id: generateId(),
    scenario: 'failure',
    feedbackText: `[剧烈的静电爆发] 错误的频率！收音机发出刺耳的尖啸，${placeholders.keyword}的声音变得扭曲而愤怒。屏幕开始闪烁，你感到一阵寒意... 也许应该重新检查线索。`,
    visualEffect: 'glitch',
  });
  
  let successText = `[信号完全稳定，变得异常清晰] 你做到了！频率准确地停在${placeholders.frequency}，时间指向${placeholders.time}，密码${placeholders.answer}缓缓输入。收音机陷入了长久的沉默，然后一个温柔的声音说："谢谢你。现在我可以安息了..."`;
  
  feedback.push({
    id: generateId(),
    scenario: 'success',
    feedbackText: successText,
    visualEffect: 'pulse',
  });
  
  return feedback;
};

const generatePlayerStepsWithTypes = (
  params: GenerationParams,
  placeholders: {
    frequency: string;
    time: string;
    answer: string;
  },
  answers: Answer[]
): { steps: string[]; stepTypes: AnswerType[] } => {
  const steps: string[] = [];
  const stepTypes: AnswerType[] = [];
  const keyword = pickRandom(params.keywords);
  
  if (params.playerKnownInfo.length > 0) {
    const knownInfo = pickRandom(params.playerKnownInfo);
    const category = getKnownInfoCategory(knownInfo);
    const knownTemplates = getKnownInfoTemplates(category);
    
    if (knownTemplates.steps.length > 0) {
      const step = pickRandom(knownTemplates.steps);
      steps.push(step);
      const categoryToType: Record<KnownInfoCategory, AnswerType | null> = {
        tape: 'tape',
        radio: 'frequency',
        document: 'code',
        name: 'code',
        history: 'time',
        symbol: 'code',
        phone: 'code',
        other: null,
      };
      const type = categoryToType[category];
      if (type) stepTypes.push(type);
    }
  }
  
  answers.forEach(answer => {
    let step = '';
    switch (answer.type) {
      case 'frequency':
        step = `打开收音机，调到${placeholders.frequency}频段`;
        break;
      case 'time':
        step = `在${placeholders.time}准时收听关键信息`;
        break;
      case 'knob':
        step = `调整收音机旋钮到${placeholders.answer.charAt(0)}点钟方向`;
        break;
      case 'tape':
        step = `按顺序播放磁带，注意第${placeholders.answer.charAt(1)}分钟的异常`;
        break;
      case 'code':
        step = `组合所有线索，得出密码${placeholders.answer}`;
        break;
    }
    if (step) {
      steps.push(step);
      stepTypes.push(answer.type);
    }
  });
  
  if (steps.length < 4) {
    const baseSteps = [
      { step: `仔细收听广播，记录${keyword}出现的次数`, type: 'code' as AnswerType },
      { step: '留意静电干扰中隐藏的信息', type: 'code' as AnswerType },
      { step: '尝试倒放广播片段，寻找隐藏线索', type: 'tape' as AnswerType },
    ];
    const shuffledBase = shuffleArray(baseSteps);
    for (const bs of shuffledBase) {
      if (steps.length < 4) {
        steps.push(bs.step);
        stepTypes.push(bs.type);
      }
    }
  }
  
  return { steps: steps.slice(0, 5), stepTypes: stepTypes.slice(0, 5) };
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
  
  const { steps: playerSteps } = generatePlayerStepsWithTypes(params, placeholders, answers);
  
  const radioSegment: RadioSegment = {
    id: generateId(),
    broadcastText: generateBroadcastText(params, placeholders),
    puzzleObjective: fillTemplate(getPuzzleObjective(), {
      keywords: params.keywords,
      ...placeholders,
    }),
    playerSteps,
  };
  
  const clues = generateClues(params, placeholders, answers);
  
  const playerFeedback = generatePlayerFeedback(params, placeholders);
  
  const tempDraft = {
    id: 'temp',
    chapterPosition: params.chapterPosition,
    playerKnownInfo: params.playerKnownInfo,
    broadcastTone: params.broadcastTone,
    horrorIntensity: params.horrorIntensity,
    keywords: params.keywords,
    radioSegment,
    clues,
    answers,
    playerFeedback,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const validation = validateClueChain(tempDraft);
  
  return {
    radioSegment,
    clues,
    answers,
    playerFeedback,
    fairnessScore: validation.score,
  };
};

export const generateMultipleVersions = (
  params: GenerationParams,
  count: number = 3
): PuzzleVersion[] => {
  const versions: PuzzleVersion[] = [];
  
  for (let i = 0; i < count; i++) {
    const result = generateRadioPuzzle(params);
    versions.push({
      id: generateId(),
      versionNumber: i + 1,
      ...result,
      createdAt: new Date(),
    });
  }
  
  return versions;
};

export const simulateDelay = (ms: number = 2000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
