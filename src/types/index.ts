export type ChapterPosition = 'opening' | 'middle' | 'climax' | 'ending';

export type BroadcastTone = 'cold' | 'hysterical' | 'whisper' | 'distorted';

export type HintLevel = 'subtle' | 'moderate' | 'obvious';

export type AnswerType = 'frequency' | 'knob' | 'tape' | 'time' | 'code';

export type FeedbackScenario = 'first_listen' | 'repeat_listen' | 'failure' | 'success';

export interface RadioSegment {
  id: string;
  broadcastText: string;
  puzzleObjective: string;
  playerSteps: string[];
}

export interface Clue {
  id: string;
  content: string;
  hintLevel: HintLevel;
  answerId?: string;
  order: number;
}

export interface Answer {
  id: string;
  type: AnswerType;
  value: string;
  description: string;
}

export interface PlayerFeedback {
  id: string;
  scenario: FeedbackScenario;
  feedbackText: string;
  visualEffect: string;
}

export interface PuzzleDraft {
  id: string;
  chapterPosition: ChapterPosition;
  playerKnownInfo: string[];
  broadcastTone: BroadcastTone;
  horrorIntensity: 1 | 2 | 3 | 4 | 5;
  keywords: string[];
  radioSegment?: RadioSegment;
  clues: Clue[];
  answers: Answer[];
  playerFeedback: PlayerFeedback[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationParams {
  chapterPosition: ChapterPosition;
  playerKnownInfo: string[];
  broadcastTone: BroadcastTone;
  horrorIntensity: 1 | 2 | 3 | 4 | 5;
  keywords: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number;
}

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  clueId?: string;
}

export const CHAPTER_POSITION_LABELS: Record<ChapterPosition, string> = {
  opening: '开篇',
  middle: '中段',
  climax: '高潮',
  ending: '结局',
};

export const BROADCAST_TONE_LABELS: Record<BroadcastTone, string> = {
  cold: '冰冷叙述',
  hysterical: '歇斯底里',
  whisper: '低语呢喃',
  distorted: '扭曲失真',
};

export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  subtle: '隐晦',
  moderate: '适中',
  obvious: '明显',
};

export const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  frequency: '频道频率',
  knob: '收音机旋钮',
  tape: '磁带顺序',
  time: '时间点',
  code: '密码组合',
};

export const FEEDBACK_SCENARIO_LABELS: Record<FeedbackScenario, string> = {
  first_listen: '第一次收听',
  repeat_listen: '重复收听',
  failure: '触发失败',
  success: '解谜成功',
};

export const HORROR_INTENSITY_LABELS: Record<number, string> = {
  1: '轻微不安',
  2: '持续紧张',
  3: '毛骨悚然',
  4: '心惊胆战',
  5: '极致恐惧',
};

export const DEFAULT_KNOWN_INFO_OPTIONS = [
  '发现了一盘旧磁带',
  '知道主播的名字',
  '拥有一台老式收音机',
  '了解这个城镇的历史',
  '找到一张旧报纸',
  '收到匿名信件',
  '看到了奇怪的符号',
  '知道一个电话号码',
];

export const DEFAULT_KEYWORD_SUGGESTIONS = [
  '失踪主播',
  '午夜频率',
  '倒放童谣',
  '静电干扰',
  '循环播放',
  '求救信号',
  '摩斯密码',
  '旧磁带',
  '废弃电台',
  '数字序列',
  '敲门声',
  '回音',
];
