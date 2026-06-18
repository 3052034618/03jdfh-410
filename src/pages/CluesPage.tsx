import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Link, AlertCircle, AlertTriangle, Info, Plus, X, Edit3, 
  Check, ChevronDown, ChevronUp, GripVertical, Target, Link2Off,
  Radio, Clock, Settings, Play, Hash, List
} from 'lucide-react';
import { usePuzzleStore } from '@/store/puzzleStore';
import { validateClueChain, getScoreColor, getScoreBgColor, getIssueColor } from '@/utils/validation';
import { 
  HINT_LEVEL_LABELS, 
  ANSWER_TYPE_LABELS, 
  type HintLevel, 
  type AnswerType,
  type Clue,
  type Answer,
} from '@/types';
import { generateId } from '@/utils/helpers';

const ANSWER_TYPE_ICONS: Record<AnswerType, typeof Radio> = {
  frequency: Radio,
  knob: Settings,
  tape: Play,
  time: Clock,
  code: Hash,
};

const ANSWER_TYPE_COLORS: Record<AnswerType, { bg: string; border: string; text: string; glow: string }> = {
  frequency: { bg: 'bg-blue-900/30', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)' },
  knob: { bg: 'bg-purple-900/30', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)' },
  tape: { bg: 'bg-emerald-900/30', border: 'border-emerald-500/50', text: 'text-emerald-400', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)' },
  time: { bg: 'bg-amber-900/30', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)' },
  code: { bg: 'bg-rose-900/30', border: 'border-rose-500/50', text: 'text-rose-400', glow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)' },
};

export default function CluesPage() {
  const { getCurrentDraft, updateClue, addClue, removeClue, updateAnswer, addAnswer, removeAnswer } = usePuzzleStore();
  const draft = getCurrentDraft();
  
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Record<AnswerType, boolean>>({
    frequency: true,
    knob: true,
    tape: true,
    time: true,
    code: true,
  });
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null);
  const [editingClueId, setEditingClueId] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [newClueContent, setNewClueContent] = useState('');
  const [newClueType, setNewClueType] = useState<AnswerType>('frequency');
  const [newAnswerValue, setNewAnswerValue] = useState('');
  const [newAnswerDesc, setNewAnswerDesc] = useState('');
  const [newAnswerType, setNewAnswerType] = useState<AnswerType>('frequency');
  const [showAddClue, setShowAddClue] = useState(false);
  const [showAddAnswer, setShowAddAnswer] = useState(false);
  const [draggedClueId, setDraggedClueId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'steps'>('steps');

  const validationResult = useMemo(() => {
    if (!draft) return null;
    return validateClueChain(draft);
  }, [draft]);

  const cluesByType = useMemo(() => {
    if (!draft) return {} as Record<AnswerType, Clue[]>;
    const grouped: Record<AnswerType, Clue[]> = {
      frequency: [],
      knob: [],
      tape: [],
      time: [],
      code: [],
    };
    draft.clues.forEach(clue => {
      const type = clue.answerType || 'code';
      grouped[type].push(clue);
    });
    return grouped;
  }, [draft]);

  const playerSteps = useMemo(() => {
    if (!draft?.radioSegment?.playerSteps) return [];
    return draft.radioSegment.playerSteps;
  }, [draft]);

  const cluesByStep = useMemo(() => {
    if (!draft) return {} as Record<number, Clue[]>;
    const grouped: Record<number, Clue[]> = {};
    draft.clues.forEach(clue => {
      const step = clue.relatedStep ?? 0;
      if (!grouped[step]) grouped[step] = [];
      grouped[step].push(clue);
    });
    return grouped;
  }, [draft]);

  const conflictClueIds = useMemo(() => {
    if (!validationResult) return new Set<string>();
    const ids = new Set<string>();
    validationResult.issues.forEach(issue => {
      if (issue.conflictType && issue.clueId) {
        ids.add(issue.clueId);
      }
    });
    return ids;
  }, [validationResult]);

  const conflictIssues = useMemo(() => {
    if (!validationResult) return [];
    return validationResult.issues.filter(i => i.conflictType);
  }, [validationResult]);

  const getConflictTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      duplicate_answer: '多答案争抢',
      missing_step_clue: '步骤缺线索',
      clue_type_mismatch: '类型不匹配',
      orphaned_clue: '无归属步骤',
    };
    return labels[type] || '冲突';
  };

  const getConflictTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      duplicate_answer: 'bg-horror-neonRed/20 text-horror-neonRed border-horror-neonRed/50',
      missing_step_clue: 'bg-horror-amber/20 text-horror-amber border-horror-amber/50',
      clue_type_mismatch: 'bg-horror-orange/20 text-horror-orange border-horror-orange/50',
      orphaned_clue: 'bg-horror-purple/20 text-horror-purple border-horror-purple/50',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  useEffect(() => {
    if (isLinkMode && selectedClueId && selectedAnswerId) {
      const answer = draft?.answers.find(a => a.id === selectedAnswerId);
      updateClue(selectedClueId, { 
        answerId: selectedAnswerId,
        answerType: answer?.type,
      });
      setSelectedClueId(null);
      setSelectedAnswerId(null);
      setIsLinkMode(false);
    }
  }, [isLinkMode, selectedClueId, selectedAnswerId, updateClue, draft]);

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="font-terminal text-gray-400">请先在生成页面创建一个谜题</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (clueId: string) => {
    setDraggedClueId(clueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (answerId: string) => {
    if (draggedClueId) {
      const answer = draft.answers.find(a => a.id === answerId);
      updateClue(draggedClueId, { 
        answerId,
        answerType: answer?.type,
      });
    }
    setDraggedClueId(null);
  };

  const handleLinkClick = (clueId: string) => {
    if (isLinkMode) {
      setSelectedClueId(clueId);
    }
  };

  const handleAnswerClick = (answerId: string) => {
    if (isLinkMode && selectedClueId) {
      setSelectedAnswerId(answerId);
    }
  };

  const handleAddClue = () => {
    if (newClueContent.trim()) {
      addClue({
        content: newClueContent.trim(),
        hintLevel: 'moderate',
        order: draft.clues.length,
        answerType: newClueType,
      });
      setNewClueContent('');
      setShowAddClue(false);
    }
  };

  const handleAddAnswer = () => {
    if (newAnswerValue.trim() && newAnswerDesc.trim()) {
      addAnswer({
        type: newAnswerType,
        value: newAnswerValue.trim(),
        description: newAnswerDesc.trim(),
      });
      setNewAnswerValue('');
      setNewAnswerDesc('');
      setShowAddAnswer(false);
    }
  };

  const getLinkedClues = (answerId: string) => {
    return draft.clues.filter(c => c.answerId === answerId);
  };

  const getHintLevelColor = (level: HintLevel): string => {
    switch (level) {
      case 'subtle': return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'moderate': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
      case 'obvious': return 'bg-green-900/30 text-green-400 border-green-500/30';
    }
  };

  const toggleType = (type: AnswerType) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getAnswerForClue = (clue: Clue): Answer | undefined => {
    return draft.answers.find(a => a.id === clue.answerId);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h2 className="font-horror text-4xl text-horror-neonGreen mb-2 text-shadow-glow">
            线索链检查
          </h2>
          <p className="font-terminal text-gray-400">
            验证每条线索是否能指向具体答案，确保谜题逻辑完整
          </p>
        </motion.div>

        {validationResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="retro-card rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                完整性验证
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-terminal text-xs text-gray-500">公平性评分</div>
                  <div className={`font-horror text-3xl ${getScoreColor(validationResult.score)}`}>
                    {validationResult.score}
                  </div>
                </div>
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#2a2a3a"
                      strokeWidth="6"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke={validationResult.score >= 80 ? '#39ff14' : validationResult.score >= 60 ? '#f59e0b' : '#ff3333'}
                      strokeWidth="6"
                      strokeDasharray={`${(validationResult.score / 100) * 176} 176`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-10 h-10 rounded-full ${getScoreBgColor(validationResult.score)} flex items-center justify-center`}>
                      {validationResult.isValid ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <X className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {validationResult.issues.length > 0 && (
              <div className="space-y-2">
                {validationResult.issues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${getIssueColor(issue.type)} flex items-start gap-3`}
                  >
                    {issue.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                    {issue.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                    {issue.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <span className="font-terminal text-sm">{issue.message}</span>
                      {issue.conflictType && (
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-terminal border ${getConflictTypeColor(issue.conflictType)}`}>
                          {getConflictTypeLabel(issue.conflictType)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {conflictIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="retro-card rounded-xl p-6 mb-8 border-2 border-horror-neonRed/50 bg-horror-neonRed/5"
          >
            <h3 className="font-terminal text-lg text-horror-neonRed mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              线索冲突提醒 ({conflictIssues.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from(new Set(conflictIssues.map(i => i.conflictType))).map((type) => {
                if (!type) return null;
                const issues = conflictIssues.filter(i => i.conflictType === type);
                return (
                  <div key={type} className={`p-3 rounded-lg border ${getConflictTypeColor(type)}`}>
                    <div className="font-terminal text-sm font-bold mb-1">
                      {getConflictTypeLabel(type)}
                    </div>
                    <div className="font-terminal text-xs opacity-80">
                      {issues.length} 个问题
                    </div>
                    <div className="mt-2 text-xs font-terminal opacity-70">
                      {issues.slice(0, 2).map((issue, i) => (
                        <div key={i} className="truncate">• {issue.message.substring(0, 30)}...</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLinkMode(!isLinkMode)}
              className={`px-4 py-2 rounded-lg font-terminal text-sm flex items-center gap-2 transition-all duration-300 ${
                isLinkMode
                  ? 'bg-horror-neonGreen/20 border-horror-neonGreen text-horror-neonGreen border-2'
                  : 'bg-horror-gray border border-horror-lightGray/50 text-gray-300 hover:border-horror-neonGreen/50'
              }`}
            >
              {isLinkMode ? <Link2Off className="w-4 h-4" /> : <Link className="w-4 h-4" />}
              {isLinkMode ? '取消关联模式' : '关联线索与答案'}
            </button>
            
            {isLinkMode && selectedClueId && (
              <div className="font-terminal text-sm text-horror-neonGreen animate-pulse">
                已选择线索，请点击答案进行关联
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-horror-gray rounded-lg p-1 border border-horror-lightGray/30">
            <button
              onClick={() => setViewMode('steps')}
              className={`px-3 py-1.5 rounded font-terminal text-sm transition-colors flex items-center gap-1.5 ${
                viewMode === 'steps'
                  ? 'bg-horror-neonGreen/20 text-horror-neonGreen'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              步骤视图
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded font-terminal text-sm transition-colors flex items-center gap-1.5 ${
                viewMode === 'grouped'
                  ? 'bg-horror-neonGreen/20 text-horror-neonGreen'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Target className="w-4 h-4" />
              类型分组
            </button>
          </div>
        </div>

        {viewMode === 'steps' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                <Play className="w-5 h-5" />
                操作步骤流程
              </h3>
              <span className="font-terminal text-xs text-gray-500">
                共 {playerSteps.length} 个操作步骤 · {draft.clues.length} 条线索
              </span>
            </div>

            <div className="space-y-4">
              {playerSteps.map((step, stepIndex) => {
                const stepClues = cluesByStep[stepIndex] || [];
                const stepAnswer = draft.answers.find(a => {
                  const firstClue = stepClues[0];
                  return firstClue?.answerId === a.id;
                });
                const isExpanded = expandedStepIndex === stepIndex;

                return (
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: stepIndex * 0.05 }}
                    className={`retro-card rounded-xl overflow-hidden`}
                  >
                    <div 
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-horror-lightGray/30 transition-colors"
                      onClick={() => setExpandedStepIndex(isExpanded ? null : stepIndex)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-horror-neonGreen/20 border-2 border-horror-neonGreen/50 flex items-center justify-center">
                        <span className="font-horror text-lg text-horror-neonGreen">
                          {stepIndex + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-terminal text-base text-gray-200">
                          {step}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {stepAnswer && (
                          <span className={`px-2 py-1 rounded text-xs font-terminal border ${ANSWER_TYPE_COLORS[stepAnswer.type].bg} ${ANSWER_TYPE_COLORS[stepAnswer.type].text} ${ANSWER_TYPE_COLORS[stepAnswer.type].border}`}>
                            {ANSWER_TYPE_LABELS[stepAnswer.type]}
                          </span>
                        )}
                        <span className="font-terminal text-xs text-gray-500">
                          {stepClues.length} 条线索
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-horror-lightGray/30"
                        >
                          <div className="p-4 bg-horror-dark/50">
                            <div className="text-xs font-terminal text-gray-500 mb-3 flex items-center gap-1">
                              <Search className="w-3.5 h-3.5" />
                              服务于本步骤的线索：
                            </div>
                            {stepClues.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {stepClues.map((clue) => {
                                  const Icon = ANSWER_TYPE_ICONS[clue.answerType || 'code'];
                                  const colors = ANSWER_TYPE_COLORS[clue.answerType || 'code'];
                                  const answer = getAnswerForClue(clue);
                                  return (
                                    <div
                                      key={clue.id}
                                      className={`p-3 rounded-lg border ${colors.bg} ${colors.border} border`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <Icon className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-terminal border ${getHintLevelColor(clue.hintLevel)}`}>
                                              {HINT_LEVEL_LABELS[clue.hintLevel]}
                                            </span>
                                            {answer && (
                                              <span className="font-terminal text-xs text-horror-amber">
                                                → {answer.value}
                                              </span>
                                            )}
                                          </div>
                                          <p className="font-terminal text-sm text-gray-300">
                                            {clue.content}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="font-terminal text-sm text-gray-500 italic">
                                本步骤暂无线索关联
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {playerSteps.length === 0 && (
                <div className="retro-card rounded-xl p-8 text-center">
                  <List className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="font-terminal text-gray-500">暂无操作步骤</p>
                  <p className="font-terminal text-gray-600 text-sm mt-1">
                    请先生成谜题
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  {viewMode === 'grouped' ? '线索分组' : '所有线索'} ({draft.clues.length})
                </h3>
                <button
                  onClick={() => setShowAddClue(!showAddClue)}
                  className="p-2 bg-horror-gray hover:bg-horror-lightGray rounded border border-horror-lightGray/50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-horror-neonGreen" />
                </button>
              </div>

              <AnimatePresence>
                {showAddClue && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-horror-gray/50 rounded-lg border border-horror-lightGray/30"
                  >
                    <div className="space-y-3">
                      <select
                        value={newClueType}
                        onChange={(e) => setNewClueType(e.target.value as AnswerType)}
                        className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50"
                      >
                        {(Object.keys(ANSWER_TYPE_LABELS) as AnswerType[]).map((type) => (
                          <option key={type} value={type}>
                            {ANSWER_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={newClueContent}
                        onChange={(e) => setNewClueContent(e.target.value)}
                        placeholder="输入新线索内容..."
                        className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50 resize-none h-20"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-3">
                      <button
                        onClick={() => setShowAddClue(false)}
                        className="px-4 py-2 bg-horror-gray rounded font-terminal text-sm text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAddClue}
                        disabled={!newClueContent.trim()}
                        className="px-4 py-2 bg-horror-neonGreen/20 border border-horror-neonGreen/50 rounded font-terminal text-sm text-horror-neonGreen hover:bg-horror-neonGreen/30 transition-colors disabled:opacity-50"
                      >
                        添加线索
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {viewMode === 'grouped' ? (
                <div className="space-y-4">
                  {(Object.keys(ANSWER_TYPE_LABELS) as AnswerType[]).map((type) => {
                  const typeClues = cluesByType[type] || [];
                  const Icon = ANSWER_TYPE_ICONS[type];
                  const colors = ANSWER_TYPE_COLORS[type];
                  const isExpanded = expandedTypes[type];

                  return (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`retro-card rounded-xl overflow-hidden ${colors.border} border`}
                    >
                      <div
                        className={`p-4 flex items-center justify-between cursor-pointer ${colors.bg} transition-colors hover:brightness-110`}
                        onClick={() => toggleType(type)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                          <span className={`font-terminal text-base ${colors.text}`}>
                            {ANSWER_TYPE_LABELS[type]}
                          </span>
                          <span className="font-terminal text-xs text-gray-500">
                            {typeClues.length} 条线索
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className={`w-5 h-5 ${colors.text}`} />
                        ) : (
                          <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="p-4 space-y-2">
                              {typeClues.length > 0 ? (
                                typeClues.sort((a, b) => a.order - b.order).map((clue, idx) => {
                                  const answer = getAnswerForClue(clue);
                                  return (
                                    <motion.div
                                      key={clue.id}
                                      draggable
                                      onDragStart={() => handleDragStart(clue.id)}
                                      onClick={() => handleLinkClick(clue.id)}
                                      className={`p-3 rounded-lg border bg-horror-gray/50 cursor-grab active:cursor-grabbing transition-all duration-300 ${
                                        isLinkMode ? 'hover:border-horror-neonGreen' : ''
                                      } ${
                                        selectedClueId === clue.id
                                          ? 'border-horror-neonGreen shadow-horror ring-2 ring-horror-neonGreen/30'
                                          : 'border-horror-lightGray/30'
                                      } ${
                                        clue.answerId
                                          ? 'border-l-4 border-l-horror-neonGreen'
                                          : 'border-l-4 border-l-horror-neonRed/50'
                                      } ${
                                        conflictClueIds.has(clue.id)
                                          ? 'ring-2 ring-horror-neonRed/50 animate-pulse'
                                          : ''
                                      }`}
                                      whileHover={{ x: 4 }}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                          <GripVertical className="w-4 h-4 text-gray-500" />
                                          <span className="w-6 h-6 rounded-full bg-horror-neonGreen/20 border border-horror-neonGreen/50 flex items-center justify-center text-xs font-terminal text-horror-neonGreen">
                                            {clue.order + 1}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className={`px-2 py-0.5 rounded text-xs font-terminal border ${getHintLevelColor(clue.hintLevel)}`}>
                                                {HINT_LEVEL_LABELS[clue.hintLevel]}
                                              </span>
                                              {conflictClueIds.has(clue.id) && (
                                                <span className="px-2 py-0.5 rounded text-xs font-terminal border bg-horror-neonRed/20 text-horror-neonRed border-horror-neonRed/50 flex items-center gap-1">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  冲突
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingClueId(editingClueId === clue.id ? null : clue.id);
                                                }}
                                                className="p-1 hover:bg-horror-lightGray rounded transition-colors"
                                              >
                                                <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-horror-neonGreen" />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm('确定删除这条线索吗？')) {
                                                    removeClue(clue.id);
                                                  }
                                                }}
                                                className="p-1 hover:bg-horror-red/30 rounded transition-colors"
                                              >
                                                <X className="w-3.5 h-3.5 text-gray-400 hover:text-horror-neonRed" />
                                              </button>
                                            </div>
                                          </div>

                                          {editingClueId === clue.id ? (
                                            <div className="space-y-2">
                                              <textarea
                                                defaultValue={clue.content}
                                                className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50 resize-none h-20"
                                                onBlur={(e) => {
                                                  updateClue(clue.id, { content: e.target.value });
                                                  setEditingClueId(null);
                                                }}
                                                autoFocus
                                              />
                                              <div className="flex gap-2">
                                                {(Object.keys(HINT_LEVEL_LABELS) as HintLevel[]).map((level) => (
                                                  <button
                                                    key={level}
                                                    onClick={() => updateClue(clue.id, { hintLevel: level })}
                                                    className={`px-2 py-1 rounded text-xs font-terminal transition-colors ${
                                                      clue.hintLevel === level
                                                        ? getHintLevelColor(level)
                                                        : 'bg-horror-gray text-gray-400 hover:text-gray-200'
                                                    }`}
                                                  >
                                                    {HINT_LEVEL_LABELS[level]}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="font-terminal text-sm text-gray-200 leading-relaxed">
                                              {clue.content}
                                            </p>
                                          )}

                                          <div className="mt-2 pt-2 border-t border-horror-lightGray/20 flex items-center justify-between">
                                            {clue.relatedStep !== undefined && clue.relatedStep !== null ? (
                                              <span className="font-terminal text-xs text-gray-500">
                                                服务步骤：第 {clue.relatedStep + 1} 步
                                              </span>
                                            ) : (
                                              <span className="font-terminal text-xs text-gray-600">
                                                未关联步骤
                                              </span>
                                            )}
                                            {answer ? (
                                              <span className="font-terminal text-xs text-horror-amber">
                                                答案：{answer.value}
                                              </span>
                                            ) : (
                                              <span className="font-terminal text-xs text-horror-neonRed">
                                                未关联答案
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })
                              ) : (
                                <p className="font-terminal text-sm text-gray-500 italic text-center py-4">
                                  暂无此类线索
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {draft.clues.sort((a, b) => a.order - b.order).map((clue, index) => {
                  const Icon = ANSWER_TYPE_ICONS[clue.answerType || 'code'];
                  const colors = ANSWER_TYPE_COLORS[clue.answerType || 'code'];
                  const answer = getAnswerForClue(clue);
                  return (
                    <motion.div
                      key={clue.id}
                      draggable
                      onDragStart={() => handleDragStart(clue.id)}
                      onClick={() => handleLinkClick(clue.id)}
                      className={`retro-card rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all duration-300 ${
                        isLinkMode ? 'hover:border-horror-neonGreen' : ''
                      } ${
                        selectedClueId === clue.id
                          ? 'border-horror-neonGreen shadow-horror ring-2 ring-horror-neonGreen/30'
                          : ''
                      } ${
                        clue.answerId
                          ? 'border-l-4 border-l-horror-neonGreen'
                          : 'border-l-4 border-l-horror-neonRed/50'
                      } ${
                        conflictClueIds.has(clue.id)
                          ? 'ring-2 ring-horror-neonRed/50 animate-pulse'
                          : ''
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-500" />
                          <span className="w-6 h-6 rounded-full bg-horror-neonGreen/20 border border-horror-neonGreen/50 flex items-center justify-center text-xs font-terminal text-horror-neonGreen">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-terminal border ${colors.bg} ${colors.text} ${colors.border} flex items-center gap-1`}>
                                <Icon className="w-3 h-3" />
                                {ANSWER_TYPE_LABELS[clue.answerType || 'code']}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-terminal border ${getHintLevelColor(clue.hintLevel)}`}>
                                {HINT_LEVEL_LABELS[clue.hintLevel]}
                              </span>
                              {conflictClueIds.has(clue.id) && (
                                <span className="px-2 py-0.5 rounded text-xs font-terminal border bg-horror-neonRed/20 text-horror-neonRed border-horror-neonRed/50 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  冲突
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClueId(editingClueId === clue.id ? null : clue.id);
                                }}
                                className="p-1 hover:bg-horror-lightGray rounded transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-horror-neonGreen" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('确定删除这条线索吗？')) {
                                    removeClue(clue.id);
                                  }
                                }}
                                className="p-1 hover:bg-horror-red/30 rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5 text-gray-400 hover:text-horror-neonRed" />
                              </button>
                            </div>
                          </div>

                          {editingClueId === clue.id ? (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={clue.content}
                                className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50 resize-none h-20"
                                onBlur={(e) => {
                                  updateClue(clue.id, { content: e.target.value });
                                  setEditingClueId(null);
                                }}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                {(Object.keys(HINT_LEVEL_LABELS) as HintLevel[]).map((level) => (
                                  <button
                                    key={level}
                                    onClick={() => updateClue(clue.id, { hintLevel: level })}
                                    className={`px-2 py-1 rounded text-xs font-terminal transition-colors ${
                                      clue.hintLevel === level
                                        ? getHintLevelColor(level)
                                        : 'bg-horror-gray text-gray-400 hover:text-gray-200'
                                    }`}
                                  >
                                    {HINT_LEVEL_LABELS[level]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="font-terminal text-sm text-gray-200 leading-relaxed">
                              {clue.content}
                            </p>
                          )}

                          <div className="mt-2 pt-2 border-t border-horror-lightGray/20 flex items-center justify-between">
                            {clue.relatedStep !== undefined && clue.relatedStep !== null ? (
                              <span className="font-terminal text-xs text-gray-500">
                                服务步骤：第 {clue.relatedStep + 1} 步
                              </span>
                            ) : (
                              <span className="font-terminal text-xs text-gray-600">
                                未关联步骤
                              </span>
                            )}
                            {answer ? (
                              <span className="font-terminal text-xs text-horror-amber">
                                答案：{answer.value}
                              </span>
                            ) : (
                              <span className="font-terminal text-xs text-horror-neonRed">
                                未关联答案
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {draft.clues.length === 0 && (
                  <div className="retro-card rounded-xl p-8 text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="font-terminal text-gray-500">暂无线索</p>
                    <p className="font-terminal text-gray-600 text-sm mt-1">
                      点击上方加号添加新线索
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-terminal text-lg text-horror-amber flex items-center gap-2">
                <Target className="w-5 h-5" />
                答案列表 ({draft.answers.length})
              </h3>
              <button
                onClick={() => setShowAddAnswer(!showAddAnswer)}
                className="p-2 bg-horror-gray hover:bg-horror-lightGray rounded border border-horror-lightGray/50 transition-colors"
              >
                <Plus className="w-4 h-4 text-horror-amber" />
              </button>
            </div>

            <AnimatePresence>
              {showAddAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-horror-gray/50 rounded-lg border border-horror-lightGray/30"
                >
                  <div className="space-y-3">
                    <select
                      value={newAnswerType}
                      onChange={(e) => setNewAnswerType(e.target.value as AnswerType)}
                      className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50"
                    >
                      {(Object.keys(ANSWER_TYPE_LABELS) as AnswerType[]).map((type) => (
                        <option key={type} value={type}>
                          {ANSWER_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newAnswerValue}
                      onChange={(e) => setNewAnswerValue(e.target.value)}
                      placeholder="答案值（如：95.5、03:15、729）"
                      className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50"
                    />
                    <input
                      type="text"
                      value={newAnswerDesc}
                      onChange={(e) => setNewAnswerDesc(e.target.value)}
                      placeholder="答案描述（如：正确的电台频率）"
                      className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-3">
                    <button
                      onClick={() => setShowAddAnswer(false)}
                      className="px-4 py-2 bg-horror-gray rounded font-terminal text-sm text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddAnswer}
                      disabled={!newAnswerValue.trim() || !newAnswerDesc.trim()}
                      className="px-4 py-2 bg-horror-amber/20 border border-horror-amber/50 rounded font-terminal text-sm text-horror-amber hover:bg-horror-amber/30 transition-colors disabled:opacity-50"
                    >
                      添加答案
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {draft.answers.map((answer) => {
                const linkedClues = getLinkedClues(answer.id);
                const Icon = ANSWER_TYPE_ICONS[answer.type];
                const colors = ANSWER_TYPE_COLORS[answer.type];
                return (
                  <motion.div
                    key={answer.id}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(answer.id)}
                    onClick={() => handleAnswerClick(answer.id)}
                    className={`retro-card rounded-lg p-4 transition-all duration-300 ${
                      isLinkMode ? 'hover:border-horror-amber cursor-pointer' : ''
                    } ${
                      selectedAnswerId === answer.id
                        ? 'border-horror-amber shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : ''
                    } ${
                      draggedClueId
                        ? 'border-dashed border-horror-amber/50'
                        : ''
                    } ${colors.border} border`}
                    whileHover={{ x: -4 }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-terminal ${colors.bg} ${colors.text} ${colors.border} border flex items-center gap-1`}>
                          <Icon className="w-3.5 h-3.5" />
                          {ANSWER_TYPE_LABELS[answer.type]}
                        </span>
                        {editingAnswerId === answer.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue={answer.value}
                              className="w-24 px-2 py-1 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-horror-neonGreen focus:outline-none focus:border-horror-neonGreen/50"
                              onBlur={(e) => {
                                updateAnswer(answer.id, { value: e.target.value });
                                setEditingAnswerId(null);
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-terminal text-lg text-horror-neonGreen text-shadow-glow">
                            {answer.value}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAnswerId(editingAnswerId === answer.id ? null : answer.id);
                          }}
                          className="p-1 hover:bg-horror-lightGray rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-horror-amber" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定删除这个答案吗？相关线索的关联也会被清除。')) {
                              removeAnswer(answer.id);
                              draft.clues.forEach(clue => {
                                if (clue.answerId === answer.id) {
                                  updateClue(clue.id, { answerId: undefined });
                                }
                              });
                            }
                          }}
                          className="p-1 hover:bg-horror-red/30 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-gray-400 hover:text-horror-neonRed" />
                        </button>
                      </div>
                    </div>

                    {editingAnswerId === answer.id ? (
                      <input
                        type="text"
                        defaultValue={answer.description}
                        className="w-full px-2 py-1 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50"
                        onBlur={(e) => {
                          updateAnswer(answer.id, { description: e.target.value });
                          setEditingAnswerId(null);
                        }}
                      />
                    ) : (
                      <p className="font-terminal text-sm text-gray-300">
                        {answer.description}
                      </p>
                    )}

                    {linkedClues.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-horror-lightGray/30">
                        <div className="text-xs font-terminal text-gray-500 mb-2">
                          关联线索 ({linkedClues.length})：
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {linkedClues.map((clue) => (
                            <span
                              key={clue.id}
                              className="px-2 py-0.5 bg-horror-neonGreen/10 border border-horror-neonGreen/30 rounded text-xs font-terminal text-horror-neonGreen"
                            >
                              #{draft.clues.findIndex(c => c.id === clue.id) + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {draft.answers.length === 0 && (
                <div className="retro-card rounded-xl p-8 text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="font-terminal text-gray-500">暂无答案</p>
                  <p className="font-terminal text-gray-600 text-sm mt-1">
                    点击上方加号添加新答案
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 retro-card rounded-xl p-6"
      >
        <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
          <Link className="w-5 h-5" />
          线索链可视化
        </h3>
        <div className="flex items-start justify-center gap-4 overflow-x-auto pb-4">
          {draft.clues.sort((a, b) => a.order - b.order).map((clue, index) => {
            const answer = draft.answers.find(a => a.id === clue.answerId);
            const colors = ANSWER_TYPE_COLORS[clue.answerType || 'code'];
            return (
              <div key={clue.id} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                    clue.answerId
                      ? `${colors.bg} border-2 ${colors.border}`
                      : 'bg-horror-gray border-2 border-horror-lightGray/50'
                  }`}>
                    <span className={`font-horror text-xl ${colors.text}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="text-center max-w-32">
                    <div className={`px-2 py-0.5 rounded text-xs font-terminal mb-1 inline-block ${getHintLevelColor(clue.hintLevel)}`}>
                      {HINT_LEVEL_LABELS[clue.hintLevel]}
                    </div>
                    <p className="font-terminal text-xs text-gray-400 line-clamp-2">
                      {clue.content}
                    </p>
                  </div>
                  {answer && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`mt-2 p-2 ${colors.bg} ${colors.border} border rounded`}
                    >
                      <div className={`text-xs font-terminal ${colors.text}`}>
                        {ANSWER_TYPE_LABELS[answer.type]}
                      </div>
                      <div className="font-terminal text-sm text-horror-neonGreen">
                        {answer.value}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
                {index < draft.clues.length - 1 && (
                  <div className="flex flex-col items-center mx-2 mt-8">
                    <div className="w-8 h-0.5 bg-horror-lightGray/50" />
                    <ChevronDown className="w-4 h-4 text-horror-lightGray/50 mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
      </div>
    </div>
  );
}
