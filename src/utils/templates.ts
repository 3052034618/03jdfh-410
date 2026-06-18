import type { BroadcastTone, ChapterPosition } from '@/types';
import { pickRandom, getRandomInt } from './helpers';

interface BroadcastTemplate {
  openings: string[];
  middles: string[];
  endings: string[];
  staticNoises: string[];
}

const coldTemplates: BroadcastTemplate = {
  openings: [
    '[静电干扰声] 这里是... 调频 {frequency}。如果你正在收听... 请记住...',
    '[轻微的嘶嘶声] 午夜广播。现在是 {time}。不要换台。',
    '[电流声] 测试... 测试... 频道 {frequency} 已接通。你不是第一个听到的。',
    '欢迎收听。这不是录制节目。你现在听到的... 正在发生。',
  ],
  middles: [
    '主播的位置... 空了。但麦克风还开着。桌上的咖啡还是温的。',
    '磁带在转。{keyword}。{keyword}。{keyword}。循环往复。',
    '如果你看到了{keyword}... 不要回应。假装你没听到。',
    '频率在波动。数字在变化。{frequency}... 不对... 是{frequency2}...',
    '敲门声。三下。停顿。三下。但门外没有人。只有{keyword}。',
  ],
  endings: [
    '[信号逐渐减弱] 记住... 倒着听... 答案在... 背面...',
    '[突然的沉默，然后是微弱的低语] 你找到了。现在关掉收音机。',
    '[静电完全覆盖了声音，只剩一个数字清晰地重复] {answer}... {answer}...',
    '明天同一时间... 如果你还在的话... 调频 {frequency}...',
  ],
  staticNoises: [
    '[沙沙声]',
    '[滋滋声]',
    '[啪嗒声]',
    '[低沉的嗡鸣]',
    '[遥远的钟声]',
  ],
};

const hystericalTemplates: BroadcastTemplate = {
  openings: [
    '[喘息声] 你必须听我说！他们来了！{keyword}！{keyword}到处都是！',
    '[哭泣声] 救救我... 我被困在... 在{keyword}里... 快！时间不多了！',
    '[尖叫声后是急促的呼吸] 不要... 不要打开那个频率！它会听到你的！',
    '[歇斯底里的笑声] 哈哈... 哈哈... 他们说没有{keyword}... 但我看到了！我摸到了！',
  ],
  middles: [
    '它在{frequency}！不对！是{frequency2}！它在移动！它在找我！',
    '{keyword}... {keyword}在墙上... 用血写的... 是我的血... 我的...',
    '我数到三... 一... 二... [长时间的沉默] ...{keyword}...',
    '磁带在播放... 但那是我的声音... 我还没说过这些话...',
    '旋钮自己在转！它指向{answer}！指向{answer}！',
  ],
  endings: [
    '[突然安静] ...它来了... [电话挂断声]',
    '[敲门声越来越急促] 记住！答案是{answer}！{answer}！快！[门被撞开的声音]',
    '[低语变成了尖叫] 不要听！不要让它{keyword}！[信号被切断]',
    '[喘息声逐渐微弱] 倒着... 播放... {keyword}... 倒着... [心跳停止的声音]',
  ],
  staticNoises: [
    '[剧烈的静电爆发]',
    '[刺耳的尖啸]',
    '[物体摔碎的声音]',
    '[急促的呼吸]',
    '[模糊的哭泣声]',
  ],
};

const whisperTemplates: BroadcastTemplate = {
  openings: [
    '[几乎听不见的声音] 嘘... 小声点... 它在听...',
    '[耳语] 你好... 我知道你在那里... 一个人... 在深夜...',
    '[呼吸声] 别害怕... 我不会伤害你... 但{keyword}会...',
    '[轻柔的低语] 把灯关了... 这样它就看不到你了... 现在听我说...',
  ],
  middles: [
    '在{time}的时候... 去{frequency}... 你会找到{keyword}...',
    '它喜欢{keyword}... 所以你要用{keyword}来引诱它... 然后...',
    '磁带的第{answer}分钟... 倒带... 你会听到真相...',
    '门后的{keyword}... 不要看... 不要听... 但要记住...',
    '三个数字... {frequency}... 加起来... 就是{answer}...',
  ],
  endings: [
    '[叹息] 我得走了... 它发现我了... 记住... 不要相信你听到的一切...',
    '[嘴唇贴近麦克风的声音] {answer}... 这是唯一的出路... [轻声笑]',
    '[渐渐远去的脚步声] 晚安... 做个好梦... 梦里有{keyword}...',
    '[温柔的歌声] 滴答... 滴答... 时间到了... {time}... {time}...',
  ],
  staticNoises: [
    '[轻微的沙沙声]',
    '[远处的风声]',
    '[木头的吱呀声]',
    '[轻柔的静电声]',
    '[几乎听不见的耳语]',
  ],
};

const distortedTemplates: BroadcastTemplate = {
  openings: [
    '[严重失真] {频率}... {keyword}... {信号}... {answer}...',
    '[断断续续] 测... 测试... {keyword}... 收... 收到吗...',
    '[倒放的声音正放着] 来过里这在你果如... {answer}... 是案答...',
    '[多重声音重叠] 欢迎欢迎欢迎... 来到来到来到... {keyword}{keyword}{keyword}...',
  ],
  middles: [
    '{keyword} [静电] {frequency} [尖叫] {answer} [倒放的童谣]',
    '数字... 不... 不是数字... {keyword}... 是{keyword}... 不... 是{answer}...',
    '[声音上下起伏] 旋钮在{answer}的位置... 不要动... 它喜欢{keyword}...',
    '[前后颠倒的句子] 听我听我听我... 不要不要不要... {keyword}...',
  ],
  endings: [
    '[完全被静电淹没，只剩几个字清晰] {answer}... {answer}... {answer}...',
    '[声音逐渐变慢，音调变低] 再... 见... {keyword}... 再... 见...',
    '[突然变成正常声音] 你不会记得这些的。[然后又变回失真] {answer}...',
    '[无数个声音同时说话] 调频{frequency}调频{frequency}调频{frequency}调频{frequency}...',
  ],
  staticNoises: [
    '[剧烈的信号丢失]',
    '[数字失真]',
    '[声音变慢]',
    '[倒放效果]',
    '[多重回声]',
  ],
};

const templateMap: Record<BroadcastTone, BroadcastTemplate> = {
  cold: coldTemplates,
  hysterical: hystericalTemplates,
  whisper: whisperTemplates,
  distorted: distortedTemplates,
};

const chapterIntros: Record<ChapterPosition, string[]> = {
  opening: [
    '一切都从这台老旧的收音机开始...',
    '你第一次听到这个频率的时候，还不知道它会改变一切...',
    '午夜，收音机自己打开了...',
  ],
  middle: [
    '你已经追查了很久，现在终于有了线索...',
    '磁带听到一半，你意识到事情比想象的更可怕...',
    '这是第几个夜晚了？你已经分不清现实和广播的界限...',
  ],
  climax: [
    '这是最后的广播。之后，要么你解开谜团，要么谜团解开你...',
    '所有的线索都指向这一刻。{keyword}是关键。',
    '它知道你在听。它一直在等你走到这一步...',
  ],
  ending: [
    '最后一盘磁带。最后的答案。最后的机会...',
    '你已经知道了真相。现在你要做出选择...',
    '当频率稳定在{frequency}的时候，一切都会结束...',
  ],
};

const puzzleObjectives = [
  '找出正确的电台频率，解开{keyword}的秘密',
  '调整收音机旋钮到正确位置，找到{keyword}',
  '按照特定顺序播放磁带，拼凑出{answer}的真相',
  '在{time}之前，破译广播中的密码{answer}',
  '倒放童谣，找到隐藏的数字{answer}',
];

const playerSteps = [
  '打开收音机，调到{frequency}频段',
  '仔细收听广播内容，记录出现的数字',
  '注意{keyword}出现的次数，这可能是线索',
  '尝试倒放磁带片段，寻找隐藏信息',
  '调整收音机旋钮，对应线索中的数字{answer}',
  '在{time}准时收听关键信息',
  '将所有数字组合起来，得到最终答案{answer}',
];

const cluePatterns = [
  { pattern: '{keyword}出现在第{number}次', hintLevel: 'subtle' as const },
  { pattern: '时间指向{time}', hintLevel: 'moderate' as const },
  { pattern: '频率稳定在{frequency}', hintLevel: 'obvious' as const },
  { pattern: '重复了{number}遍', hintLevel: 'subtle' as const },
  { pattern: '旋钮指向{number}点钟方向', hintLevel: 'moderate' as const },
  { pattern: '磁带第{number}分钟有异常', hintLevel: 'moderate' as const },
  { pattern: '答案是{answer}', hintLevel: 'obvious' as const },
];

export const getRandomFrequency = (): string => {
  const freq = getRandomInt(88, 108);
  const decimal = getRandomInt(1, 9);
  return `${freq}.${decimal}`;
};

export const getRandomTime = (): string => {
  const hour = getRandomInt(0, 23).toString().padStart(2, '0');
  const minute = getRandomInt(0, 59).toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

export const getRandomAnswer = (): string => {
  const digits = Array.from({ length: 3 }, () => getRandomInt(0, 9));
  return digits.join('');
};

export const getTemplates = (tone: BroadcastTone): BroadcastTemplate => {
  return templateMap[tone];
};

export const getChapterIntro = (position: ChapterPosition): string => {
  return pickRandom(chapterIntros[position]);
};

export const getPuzzleObjective = (): string => {
  return pickRandom(puzzleObjectives);
};

export const getPlayerSteps = (count: number = 3): string[] => {
  const shuffled = [...playerSteps].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getCluePattern = () => {
  return pickRandom(cluePatterns);
};

export const generateStaticNoise = (tone: BroadcastTone): string => {
  const templates = getTemplates(tone);
  return pickRandom(templates.staticNoises);
};
