import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Link, AlertCircle, AlertTriangle, Info, Plus, X, Edit3, 
  Check, ChevronDown, ChevronUp, GripVertical, Target, Link2Off 
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

export default function CluesPage() {
  const { getCurrentDraft, updateClue, addClue, removeClue, updateAnswer, addAnswer, removeAnswer } = usePuzzleStore();
  const draft = getCurrentDraft();
  
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [expandedClueId, setExpandedClueId] = useState<string | null>(null);
  const [editingClueId, setEditingClueId] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [newClueContent, setNewClueContent] = useState('');
  const [newAnswerValue, setNewAnswerValue] = useState('');
  const [newAnswerDesc, setNewAnswerDesc] = useState('');
  const [newAnswerType, setNewAnswerType] = useState<AnswerType>('frequency');
  const [showAddClue, setShowAddClue] = useState(false);
  const [showAddAnswer, setShowAddAnswer] = useState(false);
  const [draggedClueId, setDraggedClueId] = useState<string | null>(null);

  const validationResult = useMemo(() => {
    if (!draft) return null;
    return validateClueChain(draft);
  }, [draft]);

  useEffect(() => {
    if (isLinkMode && selectedClueId && selectedAnswerId) {
      updateClue(selectedClueId, { answerId: selectedAnswerId });
      setSelectedClueId(null);
      setSelectedAnswerId(null);
      setIsLinkMode(false);
    }
  }, [isLinkMode, selectedClueId, selectedAnswerId, updateClue]);

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
      updateClue(draggedClueId, { answerId });
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
                    <span className="font-terminal text-sm">{issue.message}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                <Search className="w-5 h-5" />
                线索列表 ({draft.clues.length})
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
                  <textarea
                    value={newClueContent}
                    onChange={(e) => setNewClueContent(e.target.value)}
                    placeholder="输入新线索内容..."
                    className="w-full px-3 py-2 bg-horror-dark border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50 resize-none h-20 mb-3"
                  />
                  <div className="flex gap-2 justify-end">
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

            <div className="space-y-3">
              {draft.clues.sort((a, b) => a.order - b.order).map((clue, index) => (
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
                        <span className={`px-2 py-0.5 rounded text-xs font-terminal border ${getHintLevelColor(clue.hintLevel)}`}>
                          {HINT_LEVEL_LABELS[clue.hintLevel]}
                        </span>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedClueId(expandedClueId === clue.id ? null : clue.id);
                            }}
                            className="p-1 hover:bg-horror-lightGray rounded transition-colors"
                          >
                            {expandedClueId === clue.id ? (
                              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            )}
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

                      <AnimatePresence>
                        {expandedClueId === clue.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-horror-lightGray/30"
                          >
                            <div className="text-xs font-terminal text-gray-500 mb-1">
                              关联答案：
                            </div>
                            {clue.answerId ? (
                              <div className="flex items-center gap-2">
                                <Target className="w-3.5 h-3.5 text-horror-neonGreen" />
                                <span className="font-terminal text-sm text-horror-neonGreen">
                                  {draft.answers.find(a => a.id === clue.answerId)?.description || '已关联'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateClue(clue.id, { answerId: undefined });
                                  }}
                                  className="p-1 hover:bg-horror-red/30 rounded transition-colors"
                                >
                                  <Link2Off className="w-3 h-3 text-gray-400 hover:text-horror-neonRed" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-terminal text-sm text-horror-neonRed">
                                未关联答案
                              </span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}

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
          </motion.div>

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
                    }`}
                    whileHover={{ x: -4 }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-xs font-terminal bg-horror-amber/20 text-horror-amber border border-horror-amber/30">
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
                        ? 'bg-horror-neonGreen/20 border-2 border-horror-neonGreen'
                        : 'bg-horror-gray border-2 border-horror-lightGray/50'
                    }`}>
                      <span className="font-horror text-xl text-horror-neonGreen">
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
                        className="mt-2 p-2 bg-horror-amber/20 border border-horror-amber/50 rounded"
                      >
                        <div className="text-xs font-terminal text-horror-amber">
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
