import type { PuzzleDraft, ValidationResult, ValidationIssue, Clue, Answer, ReviewItem, VersionReview } from '@/types';
import {
  CHAPTER_POSITION_LABELS,
  BROADCAST_TONE_LABELS,
  HORROR_INTENSITY_LABELS,
  HINT_LEVEL_LABELS,
  ANSWER_TYPE_LABELS,
  FEEDBACK_SCENARIO_LABELS,
  REVIEW_SECTION_LABELS,
} from '@/types';
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

  const conflictIssues = checkClueConflicts(draft);
  issues.push(...conflictIssues);

  const stepClueIssues = checkStepClueCoverage(draft);
  issues.push(...stepClueIssues);
  
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

const checkClueConflicts = (draft: PuzzleDraft): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const answerClueMap = new Map<string, string[]>();

  draft.clues.forEach(clue => {
    if (clue.answerId) {
      if (!answerClueMap.has(clue.answerId)) {
        answerClueMap.set(clue.answerId, []);
      }
      answerClueMap.get(clue.answerId)!.push(clue.id);
    }
  });

  const clueContentMap = new Map<string, string[]>();
  draft.clues.forEach(clue => {
    const normalizedContent = clue.content.toLowerCase().trim();
    if (!clueContentMap.has(normalizedContent)) {
      clueContentMap.set(normalizedContent, []);
    }
    clueContentMap.get(normalizedContent)!.push(clue.id);
  });

  clueContentMap.forEach((clueIds, content) => {
    if (clueIds.length > 1) {
      const answerIds = new Set<string>();
      clueIds.forEach(id => {
        const clue = draft.clues.find(c => c.id === id);
        if (clue?.answerId) {
          answerIds.add(clue.answerId);
        }
      });
      
      if (answerIds.size > 1) {
        const answers = Array.from(answerIds).map(id => draft.answers.find(a => a.id === id)?.value).filter(Boolean);
        const involvedIds = Array.from(answerIds);
        issues.push({
          id: generateId(),
          type: 'error',
          message: `多条相同线索被不同答案争抢：内容为"${content.substring(0, 30)}..."的 ${clueIds.length} 条线索，分别关联了 ${answers.join('、')} 等 ${answerIds.size} 个答案，请明确每条线索的唯一指向。`,
          conflictType: 'duplicate_answer',
          involvedAnswerIds: involvedIds,
        });
      }
    }
  });

  const clueAnswerMap = new Map<string, string[]>();
  draft.clues.forEach(clue => {
    if (clue.answerId) {
      if (!clueAnswerMap.has(clue.id)) {
        clueAnswerMap.set(clue.id, []);
      }
      clueAnswerMap.get(clue.id)!.push(clue.answerId);
    }
  });

  clueAnswerMap.forEach((answerIds, clueId) => {
    if (answerIds.length > 1) {
      const answers = answerIds.map(id => draft.answers.find(a => a.id === id)?.value).filter(Boolean);
      const involvedIds = [...answerIds];
      issues.push({
        id: generateId(),
        type: 'error',
        message: `线索被多个答案争抢：这条线索同时关联了 ${answers.join('、')} 等 ${answerIds.length} 个答案，请明确线索的唯一指向。`,
        clueId,
        conflictType: 'duplicate_answer',
        involvedAnswerIds: involvedIds,
      });
    }
  });

  draft.clues.forEach(clue => {
    if (clue.answerId && clue.answerType) {
      const answer = draft.answers.find(a => a.id === clue.answerId);
      if (answer && answer.type !== clue.answerType) {
        issues.push({
          id: generateId(),
          type: 'warning',
          message: `线索类型不匹配："${clue.content.substring(0, 20)}..." 标记为 ${clue.answerType} 类型，但关联的答案是 ${answer.type} 类型。`,
          clueId: clue.id,
          conflictType: 'clue_type_mismatch',
          involvedAnswerIds: [clue.answerId],
        });
      }
    }
  });

  return issues;
};

const checkStepClueCoverage = (draft: PuzzleDraft): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  
  if (!draft.radioSegment || !draft.radioSegment.playerSteps) {
    return issues;
  }

  const steps = draft.radioSegment.playerSteps;
  const stepTypes: Array<{ stepIndex: number; type: string | null }> = [];

  steps.forEach((step, index) => {
    let type: string | null = null;
    if (step.includes('频率') || step.includes('调频') || step.includes('电台') || step.includes('FM')) {
      type = 'frequency';
    } else if (step.includes('旋钮') || step.includes('旋转') || step.includes('档位')) {
      type = 'knob';
    } else if (step.includes('磁带') || step.includes('播放') || step.includes('倒带')) {
      type = 'tape';
    } else if (step.includes('时间') || step.includes('点钟') || step.includes('午夜') || step.includes('凌晨')) {
      type = 'time';
    } else if (step.includes('密码') || step.includes('组合') || step.includes('数字')) {
      type = 'code';
    }
    stepTypes.push({ stepIndex: index, type });
  });

  stepTypes.forEach(({ stepIndex, type }) => {
    if (type) {
      const hasClue = draft.clues.some(c => 
        c.relatedStep === stepIndex && c.answerType === type
      );
      if (!hasClue) {
        const typeLabel: Record<string, string> = {
          frequency: '频率',
          knob: '旋钮',
          tape: '磁带',
          time: '时间',
          code: '密码',
        };
        issues.push({
          id: generateId(),
          type: 'warning',
          message: `第 ${stepIndex + 1} 步"${steps[stepIndex].substring(0, 15)}..."缺少 ${typeLabel[type]} 类型的关键线索支撑，玩家可能不知道该如何操作。`,
          conflictType: 'missing_step_clue',
        });
      }
    }
  });

  const orphanedClues = draft.clues.filter(c => 
    c.relatedStep === undefined || c.relatedStep === null || c.relatedStep >= steps.length
  );
  if (orphanedClues.length > 0) {
    issues.push({
      id: generateId(),
      type: 'warning',
      message: `有 ${orphanedClues.length} 条线索没有归属到具体操作步骤，建议为每条线索设置 relatedStep 字段。`,
      conflictType: 'orphaned_clue',
    });
  }

  return issues;
};

export const generateDeliveryMarkdown = (
  draft: PuzzleDraft,
  validationResult: ValidationResult,
  reviewItems: ReviewItem[] = [],
  versionReview?: VersionReview
): string => {

  const steps = draft.radioSegment?.playerSteps || [];
  
  let md = `# 阴间电台谜题 - 关卡需求卡\n\n`;
  
  md += `## 基本信息\n\n`;
  md += `- **章节位置**：${CHAPTER_POSITION_LABELS[draft.chapterPosition]}\n`;
  md += `- **广播口吻**：${BROADCAST_TONE_LABELS[draft.broadcastTone]}\n`;
  md += `- **恐怖强度**：${draft.horrorIntensity} - ${HORROR_INTENSITY_LABELS[draft.horrorIntensity]}\n`;
  md += `- **关键词**：${draft.keywords.join('、')}\n`;
  if (draft.playerKnownInfo.length > 0) {
    md += `- **玩家已知信息**：${draft.playerKnownInfo.join('、')}\n`;
  }
  md += `- **公平性评分**：${validationResult.score}/100 ${validationResult.score >= 80 ? '✅' : validationResult.score >= 60 ? '⚠️' : '❌'}\n\n`;

  if (versionReview && (versionReview.notes || versionReview.recommendation)) {
    md += `## 版本评审\n\n`;
    if (versionReview.recommendation) {
      md += `### 推荐理由\n\n> ${versionReview.recommendation}\n\n`;
    }
    if (versionReview.notes) {
      md += `### 评审备注\n\n${versionReview.notes}\n\n`;
    }
    md += `*评审时间：${new Date(versionReview.reviewDate).toLocaleString('zh-CN')}*\n\n`;
  }

  md += `## 广播稿\n\n`;
  md += `\`\`\`\n${draft.radioSegment?.broadcastText || '未生成'}\n\`\`\`\n\n`;

  md += `## 解谜目标\n\n`;
  md += `${draft.radioSegment?.puzzleObjective || '未生成'}\n\n`;

  md += `## 玩家操作步骤\n\n`;
  steps.forEach((step, index) => {
    const stepClues = draft.clues.filter(c => c.relatedStep === index);
    const stepAnswer = draft.answers.find(a => 
      stepClues.some(c => c.answerId === a.id)
    );
    md += `### 步骤 ${index + 1}：${step}\n\n`;
    if (stepAnswer) {
      md += `- **目标答案**：[${ANSWER_TYPE_LABELS[stepAnswer.type]}] ${stepAnswer.value} - ${stepAnswer.description}\n`;
    }
    if (stepClues.length > 0) {
      md += `- **支撑线索**：\n`;
      stepClues.forEach((clue, i) => {
        md += `  ${i + 1}. [${HINT_LEVEL_LABELS[clue.hintLevel]}] ${clue.content}\n`;
      });
    }
    md += `\n`;
  });

  md += `## 答案表\n\n`;
  md += `| 序号 | 类型 | 答案值 | 描述 | 关联线索数 |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  draft.answers.forEach((answer, index) => {
    const clueCount = draft.clues.filter(c => c.answerId === answer.id).length;
    md += `| ${index + 1} | ${ANSWER_TYPE_LABELS[answer.type]} | ${answer.value} | ${answer.description} | ${clueCount} |\n`;
  });
  md += `\n`;

  md += `## 线索链\n\n`;
  draft.clues.sort((a, b) => a.order - b.order).forEach((clue, index) => {
    const answer = draft.answers.find(a => a.id === clue.answerId);
    md += `### 线索 ${index + 1}\n\n`;
    md += `- **内容**：${clue.content}\n`;
    md += `- **明显程度**：${HINT_LEVEL_LABELS[clue.hintLevel]}\n`;
    md += `- **线索类型**：${clue.answerType ? ANSWER_TYPE_LABELS[clue.answerType] : '未指定'}\n`;
    md += `- **服务步骤**：第 ${(clue.relatedStep ?? 0) + 1} 步\n`;
    if (answer) {
      md += `- **指向答案**：${answer.value}\n`;
    }
    md += `\n`;
  });

  md += `## 玩家反馈场景\n\n`;
  draft.playerFeedback.forEach((fb) => {
    md += `### ${FEEDBACK_SCENARIO_LABELS[fb.scenario]}\n\n`;
    md += `- **视觉效果**：${fb.visualEffect}\n`;
    md += `- **反馈文本**：\n\n`;
    md += `  > ${fb.feedbackText.replace(/\n/g, '\n  > ')}\n\n`;
  });

  if (validationResult.issues.length > 0) {
    md += `## 验证问题\n\n`;
    const errors = validationResult.issues.filter(i => i.type === 'error');
    const warnings = validationResult.issues.filter(i => i.type === 'warning');
    const infos = validationResult.issues.filter(i => i.type === 'info');
    
    if (errors.length > 0) {
      md += `### ❌ 错误 (${errors.length})\n\n`;
      errors.forEach((issue, i) => {
        md += `${i + 1}. ${issue.message}\n`;
      });
      md += `\n`;
    }
    
    if (warnings.length > 0) {
      md += `### ⚠️ 警告 (${warnings.length})\n\n`;
      warnings.forEach((issue, i) => {
        md += `${i + 1}. ${issue.message}\n`;
      });
      md += `\n`;
    }
    
    if (infos.length > 0) {
      md += `### ℹ️ 提示 (${infos.length})\n\n`;
      infos.forEach((issue, i) => {
        md += `${i + 1}. ${issue.message}\n`;
      });
      md += `\n`;
    }
  }

  if (reviewItems.length > 0) {
    md += `## 评审记录\n\n`;
    const sections = [...new Set(reviewItems.map(r => r.section))];
    sections.forEach(section => {
      const sectionItems = reviewItems.filter(r => r.section === section);
      md += `### ${REVIEW_SECTION_LABELS[section]}\n\n`;
      sectionItems.forEach(item => {
        const statusIcon = item.status === 'approved' ? '✅ 通过' : item.status === 'rejected' ? '❌ 打回' : '⏳ 待评审';
        md += `- ${statusIcon}`;
        if (item.itemKey) {
          md += ` **${item.itemKey}**`;
        }
        md += `\n`;
        if (item.comment) {
          md += `  > ${item.comment}\n`;
        }
      });
      md += `\n`;
    });
  }

  md += `---\n\n`;
  md += `*由阴间电台谜题草稿台自动生成于 ${new Date().toLocaleString('zh-CN')}*\n`;

  return md;
};
