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
  answerIds?: string[];
  answerType?: AnswerType;
  order: number;
  relatedStep?: number;
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
  conflictType?: 'duplicate_answer' | 'missing_step_clue' | 'clue_type_mismatch' | 'orphaned_clue';
  involvedAnswerIds?: string[];
}

export type ReviewSection = 'broadcast' | 'objective' | 'steps' | 'answers' | 'clues' | 'feedback';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewConclusion = 'approved' | 'rejected' | 'pending';

export interface ReviewItem {
  id: string;
  section: ReviewSection;
  status: ReviewStatus;
  comment: string;
  itemKey?: string;
}

export interface ReviewRound {
  id: string;
  draftId: string;
  reviewerName: string;
  reviewDate: Date;
  conclusion: ReviewConclusion;
  overallComment: string;
  items: ReviewItem[];
}

export interface VersionReview {
  versionId: string;
  notes: string;
  recommendation: string;
  reviewDate: Date;
  pros?: string[];
  cons?: string[];
}

export interface DeliveryPackage {
  title: string;
  chapterPosition: string;
  broadcastTone: string;
  horrorIntensity: string;
  keywords: string[];
  playerKnownInfo: string[];
  broadcastText: string;
  puzzleObjective: string;
  playerSteps: Array<{
    stepNumber: number;
    description: string;
    relatedClues: Clue[];
    relatedAnswer?: Answer;
  }>;
  answers: Array<{
    type: string;
    value: string;
    description: string;
    relatedClues: Clue[];
  }>;
  clues: Array<{
    order: number;
    content: string;
    hintLevel: string;
    answerType: string;
    relatedStep: number;
    answerValue?: string;
  }>;
  feedbackScenarios: Array<{
    scenario: string;
    feedbackText: string;
    visualEffect: string;
  }>;
  fairnessScore: number;
  validationIssues: ValidationIssue[];
}

export interface PuzzleVersion {
  id: string;
  versionNumber: number;
  radioSegment: RadioSegment;
  clues: Clue[];
  answers: Answer[];
  playerFeedback: PlayerFeedback[];
  fairnessScore: number;
  createdAt: Date;
  review?: VersionReview;
}

export const REVIEW_SECTION_LABELS: Record<ReviewSection, string> = {
  broadcast: '广播稿',
  objective: '解谜目标',
  steps: '操作步骤',
  answers: '答案表',
  clues: '线索链',
  feedback: '反馈场景',
};

export type KnownInfoCategory = 'tape' | 'radio' | 'document' | 'name' | 'history' | 'symbol' | 'phone' | 'other';

export const KNOWN_INFO_CATEGORY_MAP: Record<string, KnownInfoCategory> = {
  '发现了一盘旧磁带': 'tape',
  '拥有一台老式收音机': 'radio',
  '找到一张旧报纸': 'document',
  '收到匿名信件': 'document',
  '知道主播的名字': 'name',
  '了解这个城镇的历史': 'history',
  '看到了奇怪的符号': 'symbol',
  '知道一个电话号码': 'phone',
};

export const ANSWER_TYPE_KEYWORDS: Record<AnswerType, string[]> = {
  frequency: ['频率', '调频', '电台', '频道', 'FM', '波段'],
  knob: ['旋钮', '旋转', '档位', '刻度', '指针'],
  tape: ['磁带', '录音带', '卡带', '倒带', '播放顺序'],
  time: ['时间', '点钟', '午夜', '凌晨', '时刻'],
  code: ['密码', '数字', '组合', '代码', '编号'],
};

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
