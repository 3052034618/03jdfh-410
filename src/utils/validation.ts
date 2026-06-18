import type { PuzzleDraft, ValidationResult, ValidationIssue, Clue, Answer } from '@/types';
import { generateId } from './helpers';

export const validateClueChain = (draft: PuzzleDraft): ValidationResult => {
  const issues: ValidationIssue[] = [];
  
  if (!draft.radioSegment) {
    issues.push({
      id: generateId(),
      type: 'error',
      message: '还未生成电台文本，请先在生成页面创建谜面。',
    });
    return { isValid: false, issues, score: 0 };
  }
  
  if (draft.clues.length === 0) {
    issues.push({
      id: generateId(),
      type: 'error',
      message: '没有提取到任何线索，请重新生成或手动添加。',
    });
    return { isValid: false, issues, score: 0 };
  }
  
  if (draft.answers.length === 0) {
    issues.push({
      id: generateId(),
      type: 'error',
      message: '没有定义任何答案，请先创建需要玩家找到的答案。',
    });
    return { isValid: false, issues, score: 0 };
  }
  
  const unassignedClues = draft.clues.filter(c => !c.answerId);
  if (unassignedClues.length > 0) {
    issues.push({
      id: generateId(),
      type: 'warning',
      message: `有 ${unassignedClues.length} 条线索未关联到具体答案，玩家可能无法理解这些线索的用途。`,
    });
  }
  
  const cluesWithoutAnswers = draft.clues.filter(c => {
    if (!c.answerId) return false;
    return !draft.answers.some(a => a.id === c.answerId);
  });
  
  if (cluesWithoutAnswers.length > 0) {
    issues.push({
      id: generateId(),
      type: 'error',
      message: `${cluesWithoutAnswers.length} 条线索关联的答案不存在，请检查关联关系。`,
    });
  }
  
  const answersWithoutClues = draft.answers.filter(a => 
    !draft.clues.some(c => c.answerId === a.id)
  );
  
  if (answersWithoutClues.length > 0) {
    issues.push({
      id: generateId(),
      type: 'warning',
      message: `有 ${answersWithoutClues.length} 个答案没有对应的线索支撑，玩家无法通过推理得到这些答案。`,
    });
  }
  
  const subtleClues = draft.clues.filter(c => c.hintLevel === 'subtle').length;
  const obviousClues = draft.clues.filter(c => c.hintLevel === 'obvious').length;
  
  if (obviousClues === 0) {
    issues.push({
      id: generateId(),
      type: 'warning',
      message: '没有明显的线索，谜题可能太难了。建议添加至少一条明显的提示。',
    });
  }
  
  if (subtleClues === 0) {
    issues.push({
      id: generateId(),
      type: 'info',
      message: '所有线索都过于明显，谜题可能缺乏挑战性。',
    });
  }
  
  const sortedClues = [...draft.clues].sort((a, b) => a.order - b.order);
  const hasLogicalFlow = checkLogicalFlow(sortedClues, draft.answers);
  
  if (!hasLogicalFlow) {
    issues.push({
      id: generateId(),
      type: 'warning',
      message: '线索链的逻辑顺序可能存在问题，建议调整线索的排列顺序，确保玩家能够逐步推理。',
    });
  }
  
  const hasRedundancy = checkRedundancy(draft.clues);
  if (hasRedundancy) {
    issues.push({
      id: generateId(),
      type: 'info',
      message: '存在内容相似的线索，可以考虑合并或调整以增加多样性。',
    });
  }
  
  if (draft.playerFeedback.length < 4) {
    issues.push({
      id: generateId(),
      type: 'warning',
      message: '玩家反馈场景不完整，建议为所有4种场景（第一次收听、重复收听、失败、成功）都添加反馈。',
    });
  }
  
  const score = calculateScore(draft, issues);
  const isValid = issues.filter(i => i.type === 'error').length === 0;
  
  return { isValid, issues, score };
};

const checkLogicalFlow = (clues: Clue[], answers: Answer[]): boolean => {
  const answerMap = new Map(answers.map(a => [a.id, a]));
  let hasFrequency = false;
  let hasTime = false;
  let hasFinalCode = false;
  
  for (const clue of clues) {
    if (!clue.answerId) continue;
    const answer = answerMap.get(clue.answerId);
    if (!answer) continue;
    
    if (answer.type === 'frequency') hasFrequency = true;
    if (answer.type === 'time') hasTime = true;
    if (answer.type === 'code') hasFinalCode = true;
  }
  
  if (hasFinalCode && (!hasFrequency || !hasTime)) {
    return false;
  }
  
  return true;
};

const checkRedundancy = (clues: Clue[]): boolean => {
  const contents = clues.map(c => c.content.toLowerCase());
  
  for (let i = 0; i < contents.length; i++) {
    for (let j = i + 1; j < contents.length; j++) {
      const similarity = calculateSimilarity(contents[i], contents[j]);
      if (similarity > 0.7) {
        return true;
      }
    }
  }
  
  return false;
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const set1 = new Set(str1.split(/\s+/));
  const set2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

const calculateScore = (draft: PuzzleDraft, issues: ValidationIssue[]): number => {
  let score = 100;
  
  const errors = issues.filter(i => i.type === 'error').length;
  const warnings = issues.filter(i => i.type === 'warning').length;
  const infos = issues.filter(i => i.type === 'info').length;
  
  score -= errors * 25;
  score -= warnings * 10;
  score -= infos * 5;
  
  const clueCount = draft.clues.length;
  if (clueCount >= 5) score += 5;
  if (clueCount >= 7) score += 5;
  
  const answerCount = draft.answers.length;
  if (answerCount >= 3) score += 5;
  
  const hasAllFeedback = draft.playerFeedback.length >= 4;
  if (hasAllFeedback) score += 5;
  
  const subtleClues = draft.clues.filter(c => c.hintLevel === 'subtle').length;
  const moderateClues = draft.clues.filter(c => c.hintLevel === 'moderate').length;
  const obviousClues = draft.clues.filter(c => c.hintLevel === 'obvious').length;
  
  if (subtleClues > 0 && moderateClues > 0 && obviousClues > 0) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-horror-neonGreen';
  if (score >= 60) return 'text-horror-amber';
  if (score >= 40) return 'text-horror-orange';
  return 'text-horror-neonRed';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-horror-green';
  if (score >= 60) return 'bg-yellow-700';
  if (score >= 40) return 'bg-orange-700';
  return 'bg-horror-red';
};

export const getIssueIcon = (type: ValidationIssue['type']): string => {
  switch (type) {
    case 'error': return 'alert-circle';
    case 'warning': return 'alert-triangle';
    case 'info': return 'info';
  }
};

export const getIssueColor = (type: ValidationIssue['type']): string => {
  switch (type) {
    case 'error': return 'text-horror-neonRed border-horror-neonRed bg-horror-red/20';
    case 'warning': return 'text-horror-amber border-horror-amber bg-yellow-900/20';
    case 'info': return 'text-horror-cyan border-horror-cyan bg-cyan-900/20';
  }
};
