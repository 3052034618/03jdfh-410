import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, MapPin, User, Volume2, AlertTriangle, Plus, X, Sparkles, 
  ArrowRight, Target, ListTodo, Layers, Check, Trash2, 
  ChevronDown, ChevronUp, Copy, RefreshCw, GitCompare, CheckCircle2,
  FileText
} from 'lucide-react';
import { usePuzzleStore } from '@/store/puzzleStore';
import { RadioKnob, SpectrumVisualizer, TypewriterText } from '@/components';
import { generateRadioPuzzle, generateMultipleVersions, simulateDelay } from '@/utils/radioGenerator';
import { validateClueChain, generateDeliveryMarkdown } from '@/utils/validation';
import { 
  CHAPTER_POSITION_LABELS, 
  BROADCAST_TONE_LABELS, 
  HORROR_INTENSITY_LABELS,
  DEFAULT_KNOWN_INFO_OPTIONS,
  DEFAULT_KEYWORD_SUGGESTIONS,
  ANSWER_TYPE_LABELS,
  HINT_LEVEL_LABELS,
  type ChapterPosition,
  type BroadcastTone,
  type PuzzleVersion,
} from '@/types';

export default function GeneratorPage() {
  const {
    generationParams,
    isGenerating,
    getCurrentDraft,
    createNewDraft,
    setChapterPosition,
    addKnownInfo,
    removeKnownInfo,
    setBroadcastTone,
    setHorrorIntensity,
    addKeyword,
    removeKeyword,
    setRadioSegment,
    setClues,
    setAnswers,
    setPlayerFeedback,
    setIsGenerating,
    versions,
    selectedVersionId,
    addVersion,
    selectVersion,
    applyVersionToDraft,
    deleteVersion,
    clearVersions,
  } = usePuzzleStore();

  const draft = getCurrentDraft();
  const [keywordInput, setKeywordInput] = useState('');
  const [showKnownInfoDropdown, setShowKnownInfoDropdown] = useState(false);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [versionCount, setVersionCount] = useState(3);
  const [showVersionPanel, setShowVersionPanel] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [showDeliveryPanel, setShowDeliveryPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!draft) {
      createNewDraft();
    }
  }, [draft, createNewDraft]);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim() && generationParams.keywords.length < 8) {
      addKeyword(keywordInput.trim());
      setKeywordInput('');
    }
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (generationParams.keywords.length < 8 && !generationParams.keywords.includes(suggestion)) {
      addKeyword(suggestion);
    }
    setShowKeywordSuggestions(false);
  };

  const handleGenerateSingle = async () => {
    if (generationParams.keywords.length === 0) {
      alert('请至少输入一个关键词');
      return;
    }

    setIsGenerating(true);
    setShowResult(false);
    setGenerationStep(0);

    await simulateDelay(500);
    setGenerationStep(1);
    await simulateDelay(800);
    setGenerationStep(2);
    await simulateDelay(600);
    setGenerationStep(3);

    const result = generateRadioPuzzle(generationParams);
    
    setRadioSegment(result.radioSegment);
    setClues(result.clues);
    setAnswers(result.answers);
    setPlayerFeedback(result.playerFeedback);
    
    addVersion({
      radioSegment: result.radioSegment,
      clues: result.clues,
      answers: result.answers,
      playerFeedback: result.playerFeedback,
      fairnessScore: result.fairnessScore,
    });
    
    setGenerationStep(4);
    await simulateDelay(300);
    setShowResult(true);
    setIsGenerating(false);
  };

  const handleGenerateMultiple = async () => {
    if (generationParams.keywords.length === 0) {
      alert('请至少输入一个关键词');
      return;
    }

    setIsGenerating(true);
    setShowResult(false);
    setGenerationStep(0);

    await simulateDelay(500);
    setGenerationStep(1);
    await simulateDelay(1000);
    setGenerationStep(2);
    await simulateDelay(800);
    setGenerationStep(3);

    const newVersions = generateMultipleVersions(generationParams, versionCount);
    
    newVersions.forEach((v, i) => {
      addVersion({
        radioSegment: v.radioSegment,
        clues: v.clues,
        answers: v.answers,
        playerFeedback: v.playerFeedback,
        fairnessScore: v.fairnessScore,
      });
    });

    if (newVersions.length > 0) {
      const latest = newVersions[newVersions.length - 1];
      setRadioSegment(latest.radioSegment);
      setClues(latest.clues);
      setAnswers(latest.answers);
      setPlayerFeedback(latest.playerFeedback);
    }
    
    setGenerationStep(4);
    await simulateDelay(300);
    setShowResult(true);
    setIsGenerating(false);
  };

  const handleApplyVersion = (versionId: string) => {
    applyVersionToDraft(versionId);
    selectVersion(versionId);
  };

  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersionIds(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else {
        if (prev.length >= 3) {
          return [...prev.slice(1), versionId];
        }
        return [...prev, versionId];
      }
    });
  };

  const handleCopyDelivery = async () => {
    if (!draft) return;
    
    const validation = validateClueChain(draft);
    const markdown = generateDeliveryMarkdown(draft, validation);
    
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const selectedVersion = useMemo(() => {
    return versions.find(v => v.id === selectedVersionId);
  }, [versions, selectedVersionId]);

  const compareVersions = useMemo(() => {
    return versions.filter(v => selectedVersionIds.includes(v.id));
  }, [versions, selectedVersionIds]);

  const steps = [
    { label: '分析参数', icon: Radio },
    { label: '生成文本', icon: Sparkles },
    { label: '提取线索', icon: Target },
    { label: '创建反馈', icon: Volume2 },
    { label: '完成', icon: Radio },
  ];

  const filteredKnownInfo = DEFAULT_KNOWN_INFO_OPTIONS.filter(
    (info) => !generationParams.playerKnownInfo.includes(info)
  );

  const filteredSuggestions = DEFAULT_KEYWORD_SUGGESTIONS.filter(
    (kw) => !generationParams.keywords.includes(kw)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-horror-neonGreen';
    if (score >= 60) return 'text-horror-amber';
    return 'text-horror-neonRed';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-horror-neonGreen/20 border-horror-neonGreen/50';
    if (score >= 60) return 'bg-horror-amber/20 border-horror-amber/50';
    return 'bg-horror-neonRed/20 border-horror-neonRed/50';
  };

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-horror-neonGreen">
            <Radio className="w-16 h-16 mx-auto mb-4" />
          </div>
          <p className="font-terminal text-gray-400">正在初始化...</p>
        </div>
      </div>
    );
  }

  const displayContent = selectedVersion || (draft.radioSegment ? {
    radioSegment: draft.radioSegment,
    clues: draft.clues,
    answers: draft.answers,
    fairnessScore: 0,
  } : null);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h2 className="font-horror text-4xl text-horror-neonGreen mb-2 text-shadow-glow">
            电台谜面生成
          </h2>
          <p className="font-terminal text-gray-400">
            配置参数，输入关键词，让系统帮你生成可落地的电台谜题
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                章节位置
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(CHAPTER_POSITION_LABELS) as ChapterPosition[]).map((position) => (
                  <button
                    key={position}
                    onClick={() => setChapterPosition(position)}
                    className={`p-3 rounded-lg font-terminal text-sm transition-all duration-300 ${
                      generationParams.chapterPosition === position
                        ? 'bg-horror-neonGreen/20 border-horror-neonGreen text-horror-neonGreen shadow-horror'
                        : 'bg-horror-gray/50 border-horror-lightGray/30 text-gray-400 hover:border-horror-neonGreen/50 hover:text-gray-200'
                    } border`}
                  >
                    {CHAPTER_POSITION_LABELS[position]}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                玩家已知信息
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {generationParams.playerKnownInfo.map((info, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="tape-label px-3 py-1.5 text-sm flex items-center gap-2"
                  >
                    {info}
                    <button
                      onClick={() => removeKnownInfo(index)}
                      className="hover:text-horror-red transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </div>
              {generationParams.playerKnownInfo.length === 0 && (
                <p className="text-gray-500 text-sm font-terminal mb-4">
                  还没有添加已知信息
                </p>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowKnownInfoDropdown(!showKnownInfoDropdown)}
                  className="w-full py-2 px-4 bg-horror-gray hover:bg-horror-lightGray border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-300 text-left flex items-center justify-between"
                >
                  <span>选择已知信息</span>
                  <Plus className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showKnownInfoDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-horror-dark border border-horror-lightGray/50 rounded-lg overflow-hidden z-10"
                    >
                      {filteredKnownInfo.length === 0 ? (
                        <div className="p-3 text-gray-500 text-sm text-center font-terminal">
                          所有选项都已添加
                        </div>
                      ) : (
                        filteredKnownInfo.map((info) => (
                          <button
                            key={info}
                            onClick={() => {
                              addKnownInfo(info);
                              setShowKnownInfoDropdown(false);
                            }}
                            className="w-full p-3 text-left text-sm font-terminal text-gray-300 hover:bg-horror-gray hover:text-horror-neonGreen transition-colors"
                          >
                            {info}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                广播口吻
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(BROADCAST_TONE_LABELS) as BroadcastTone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setBroadcastTone(tone)}
                    className={`p-4 rounded-lg font-terminal text-sm transition-all duration-300 ${
                      generationParams.broadcastTone === tone
                        ? 'bg-horror-neonGreen/20 border-horror-neonGreen text-horror-neonGreen shadow-horror'
                        : 'bg-horror-gray/50 border-horror-lightGray/30 text-gray-400 hover:border-horror-neonGreen/50 hover:text-gray-200'
                    } border`}
                  >
                    {BROADCAST_TONE_LABELS[tone]}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                恐怖强度
              </h3>
              <div className="flex items-center justify-center gap-8">
                <RadioKnob
                  value={generationParams.horrorIntensity}
                  min={1}
                  max={5}
                  step={1}
                  onChange={(value) => setHorrorIntensity(value as 1 | 2 | 3 | 4 | 5)}
                  size="lg"
                  glowColor={
                    generationParams.horrorIntensity <= 2
                      ? '#39ff14'
                      : generationParams.horrorIntensity <= 3
                      ? '#f59e0b'
                      : '#ff3333'
                  }
                  showValue={false}
                />
                <div className="text-center">
                  <div className="font-horror text-3xl text-horror-neonGreen text-shadow-glow mb-2">
                    {generationParams.horrorIntensity}
                  </div>
                  <div className="font-terminal text-sm text-gray-400">
                    {HORROR_INTENSITY_LABELS[generationParams.horrorIntensity]}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        level <= generationParams.horrorIntensity
                          ? level <= 2
                            ? 'bg-horror-neonGreen shadow-[0_0_10px_#39ff14]'
                            : level <= 3
                            ? 'bg-horror-amber shadow-[0_0_10px_#f59e0b]'
                            : 'bg-horror-neonRed shadow-[0_0_10px_#ff3333]'
                          : 'bg-horror-lightGray'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                恐怖关键词
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {generationParams.keywords.map((keyword, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="tape-label px-3 py-1.5 text-sm flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(index)}
                      className="hover:text-horror-red transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </div>
              {generationParams.keywords.length === 0 && (
                <p className="text-gray-500 text-sm font-terminal mb-4">
                  输入 3-5 个关键词，如：失踪主播、午夜频率、倒放童谣
                </p>
              )}
              <form onSubmit={handleAddKeyword} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onFocus={() => setShowKeywordSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowKeywordSuggestions(false), 200)}
                  placeholder="输入关键词后按回车添加..."
                  className="flex-1 px-4 py-2 bg-horror-gray border border-horror-lightGray/50 rounded font-terminal text-sm text-gray-200 focus:outline-none focus:border-horror-neonGreen/50"
                  disabled={generationParams.keywords.length >= 8}
                />
                <button
                  type="submit"
                  disabled={!keywordInput.trim() || generationParams.keywords.length >= 8}
                  className="px-4 py-2 bg-horror-neonGreen/20 border border-horror-neonGreen/50 rounded font-terminal text-sm text-horror-neonGreen hover:bg-horror-neonGreen/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              <div className="relative">
                <AnimatePresence>
                  {showKeywordSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-horror-dark border border-horror-lightGray/50 rounded-lg overflow-hidden z-10"
                    >
                      <p className="px-3 py-2 text-xs text-gray-500 font-terminal border-b border-horror-lightGray/30">
                        推荐关键词：
                      </p>
                      <div className="flex flex-wrap p-2 gap-2">
                        {filteredSuggestions.slice(0, 6).map((suggestion) => (
                          <button
                            key={suggestion}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleAddSuggestion(suggestion)}
                            className="px-3 py-1 bg-horror-gray rounded text-xs font-terminal text-gray-300 hover:bg-horror-lightGray hover:text-horror-neonGreen transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                生成选项
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-terminal text-sm text-gray-400">生成版本数：</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      onClick={() => setVersionCount(count)}
                      className={`w-8 h-8 rounded font-terminal text-sm transition-all ${
                        versionCount === count
                          ? 'bg-horror-neonGreen/20 border-horror-neonGreen text-horror-neonGreen'
                          : 'bg-horror-gray border-horror-lightGray/30 text-gray-400 hover:border-horror-neonGreen/50'
                      } border`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateSingle}
                  disabled={isGenerating || generationParams.keywords.length === 0}
                  className="flex-1 py-3 bg-horror-gray/50 hover:bg-horror-gray border border-horror-lightGray/50 rounded-lg font-terminal text-sm text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  单版本生成
                </button>
                <button
                  onClick={handleGenerateMultiple}
                  disabled={isGenerating || generationParams.keywords.length === 0}
                  className="flex-1 py-3 bg-horror-neonGreen/20 hover:bg-horror-neonGreen/30 border-2 border-horror-neonGreen rounded-lg font-terminal text-sm text-horror-neonGreen transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-horror"
                >
                  <Sparkles className="w-4 h-4" />
                  多版本生成
                </button>
              </div>
            </motion.div>

            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="retro-card rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          index <= generationStep
                            ? 'bg-horror-neonGreen/20 border-2 border-horror-neonGreen'
                            : 'bg-horror-gray border-2 border-horror-lightGray/50'
                        }`}
                        animate={
                          index === generationStep
                            ? { scale: [1, 1.1, 1] }
                            : {}
                        }
                        transition={{ duration: 0.5, repeat: index === generationStep ? Infinity : 0 }}
                      >
                        <step.icon
                          className={`w-5 h-5 ${
                          index <= generationStep ? 'text-horror-neonGreen' : 'text-gray-500'
                        }`}
                        />
                      </motion.div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-12 h-0.5 mx-2 transition-all duration-500 ${
                            index < generationStep ? 'bg-horror-neonGreen' : 'bg-horror-lightGray/30'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <SpectrumVisualizer active={isGenerating} height={40} intensity={0.8} />
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            {versions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="retro-card rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setShowVersionPanel(!showVersionPanel)}
                  className="w-full p-4 flex items-center justify-between hover:bg-horror-gray/30 transition-colors"
                >
                  <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    生成版本 ({versions.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {versions.length >= 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedVersionIds.length >= 2) {
                            setShowComparePanel(!showComparePanel);
                          } else {
                            alert('请先选择 2-3 个版本进行对照（点击版本卡片左侧的复选框）');
                          }
                        }}
                        className={`px-3 py-1 rounded text-xs font-terminal transition-colors flex items-center gap-1 ${
                          selectedVersionIds.length >= 2
                            ? 'bg-horror-neonGreen/20 text-horror-neonGreen border border-horror-neonGreen/50 hover:bg-horror-neonGreen/30'
                            : 'bg-horror-gray text-gray-500 border border-horror-lightGray/30'
                        }`}
                        title="版本对照"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        对照 ({selectedVersionIds.length}/3)
                      </button>
                    )}
                    {versions.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('确定要清空所有版本吗？')) {
                            clearVersions();
                            setSelectedVersionIds([]);
                            setShowComparePanel(false);
                          }
                        }}
                        className="text-gray-500 hover:text-horror-neonRed transition-colors p-1"
                        title="清空版本"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {showVersionPanel ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {showVersionPanel && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-2 max-h-80 overflow-y-auto">
                        {versions.map((version, index) => {
                          const isSelected = selectedVersionIds.includes(version.id);
                          return (
                          <motion.div
                            key={version.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => selectVersion(version.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedVersionId === version.id
                                ? 'bg-horror-neonGreen/10 border-horror-neonGreen/50'
                                : 'bg-horror-gray/30 border-horror-lightGray/30 hover:border-horror-neonGreen/30'
                            } ${
                              isSelected ? 'ring-2 ring-horror-neonGreen/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVersionSelection(version.id);
                                }}
                                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-horror-neonGreen border-horror-neonGreen'
                                    : 'border-horror-lightGray/50 hover:border-horror-neonGreen/50'
                                }`}
                                title="选择用于对照"
                              >
                                {isSelected && <Check className="w-3 h-3 text-horror-dark" />}
                              </button>
                              <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-terminal text-sm text-gray-200 flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  selectedVersionId === version.id
                                    ? 'bg-horror-neonGreen/20 text-horror-neonGreen'
                                    : 'bg-horror-lightGray/30 text-gray-400'
                                }`}>
                                  {version.versionNumber}
                                </span>
                                版本 {version.versionNumber}
                              </span>
                              <div className={`px-2 py-0.5 rounded text-xs font-terminal border ${getScoreBgColor(version.fairnessScore)}`}>
                                <span className={getScoreColor(version.fairnessScore)}>
                                  公平性 {version.fairnessScore}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-terminal text-gray-500">
                              <span>线索 {version.clues.length} 条</span>
                              <span>答案 {version.answers.length} 个</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyVersion(version.id);
                                }}
                                className="flex-1 py-1.5 bg-horror-neonGreen/20 hover:bg-horror-neonGreen/30 border border-horror-neonGreen/50 rounded text-xs font-terminal text-horror-neonGreen transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                应用此版本
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteVersion(version.id);
                                  setSelectedVersionIds(prev => prev.filter(id => id !== version.id));
                                }}
                                className="px-3 py-1.5 bg-horror-gray/50 hover:bg-horror-red/20 border border-horror-lightGray/30 hover:border-horror-red/50 rounded text-xs font-terminal text-gray-400 hover:text-horror-red transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <AnimatePresence>
              {showComparePanel && compareVersions.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="retro-card rounded-xl overflow-hidden mb-6"
                >
                  <div className="p-4 border-b border-horror-lightGray/30 flex items-center justify-between bg-horror-neonGreen/5">
                    <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                      <GitCompare className="w-5 h-5" />
                      版本对照 ({compareVersions.length} 个版本)
                    </h3>
                    <button
                      onClick={() => setShowComparePanel(false)}
                      className="p-1 hover:bg-horror-gray rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareVersions.length}, minmax(320px, 1fr))` }}>
                      {compareVersions.map((version, vIndex) => (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: vIndex * 0.1 }}
                          className={`retro-card rounded-lg p-4 ${
                            selectedVersionId === version.id ? 'ring-2 ring-horror-neonGreen' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-horror-lightGray/30">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-horror-neonGreen/20 border border-horror-neonGreen/50 flex items-center justify-center font-horror text-lg text-horror-neonGreen">
                                {version.versionNumber}
                              </span>
                              <span className="font-terminal text-base text-gray-200">
                                版本 {version.versionNumber}
                              </span>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-terminal border ${getScoreBgColor(version.fairnessScore)}`}>
                              <span className={getScoreColor(version.fairnessScore)}>
                                {version.fairnessScore} 分
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="font-terminal text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Radio className="w-3 h-3" /> 广播文本
                              </div>
                              <div className="p-2 bg-horror-dark/50 rounded text-xs font-terminal text-gray-300 max-h-24 overflow-y-auto leading-relaxed">
                                {version.radioSegment.broadcastText.substring(0, 150)}...
                              </div>
                            </div>

                            <div>
                              <div className="font-terminal text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Target className="w-3 h-3" /> 解谜目标
                              </div>
                              <div className="p-2 bg-horror-dark/50 rounded text-xs font-terminal text-gray-300 max-h-20 overflow-y-auto">
                                {version.radioSegment.puzzleObjective}
                              </div>
                            </div>

                            <div>
                              <div className="font-terminal text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <ListTodo className="w-3 h-3" /> 操作步骤 ({version.radioSegment.playerSteps.length})
                              </div>
                              <ol className="space-y-1">
                                {version.radioSegment.playerSteps.slice(0, 3).map((step, i) => (
                                  <li key={i} className="text-xs font-terminal text-gray-300 flex items-start gap-2">
                                    <span className="text-horror-neonGreen">{i + 1}.</span>
                                    <span className="truncate">{step}</span>
                                  </li>
                                ))}
                                {version.radioSegment.playerSteps.length > 3 && (
                                  <li className="text-xs font-terminal text-gray-500">
                                    ... 还有 {version.radioSegment.playerSteps.length - 3} 步
                                  </li>
                                )}
                              </ol>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-horror-lightGray/20">
                              <div className="flex-1 p-2 bg-horror-dark/50 rounded text-center">
                                <div className="font-terminal text-xs text-gray-500">线索</div>
                                <div className="font-horror text-xl text-horror-neonGreen">
                                  {version.clues.length}
                                </div>
                              </div>
                              <div className="flex-1 p-2 bg-horror-dark/50 rounded text-center">
                                <div className="font-terminal text-xs text-gray-500">答案</div>
                                <div className="font-horror text-xl text-horror-amber">
                                  {version.answers.length}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleApplyVersion(version.id)}
                              className={`w-full py-2 rounded font-terminal text-sm transition-colors flex items-center justify-center gap-1 ${
                                selectedVersionId === version.id
                                  ? 'bg-horror-neonGreen/30 border-2 border-horror-neonGreen text-horror-neonGreen'
                                  : 'bg-horror-neonGreen/10 border border-horror-neonGreen/50 text-horror-neonGreen hover:bg-horror-neonGreen/20'
                              }`}
                            >
                              {selectedVersionId === version.id ? (
                                <><CheckCircle2 className="w-4 h-4" /> 当前草稿</>
                              ) : (
                                <><Check className="w-4 h-4" /> 设为当前草稿</>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {showResult && displayContent && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="retro-card rounded-xl p-6 relative overflow-hidden">
                    <div className="static-noise" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                        <Radio className="w-5 h-5" />
                        电台文本
                      </h3>
                      {selectedVersion && (
                        <span className="px-2 py-1 bg-horror-neonGreen/10 border border-horror-neonGreen/30 rounded text-xs font-terminal text-horror-neonGreen">
                          版本 {selectedVersion.versionNumber}
                        </span>
                      )}
                    </div>
                    <div className="font-terminal text-gray-200 leading-relaxed relative z-10 max-h-64 overflow-y-auto">
                      <TypewriterText
                        text={displayContent.radioSegment.broadcastText}
                        speed={25}
                        className="text-shadow-glow"
                      />
                    </div>
                    <div className="mt-6 pt-4 border-t border-horror-lightGray/30 relative z-10">
                      <SpectrumVisualizer active={true} height={50} intensity={0.6} />
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="retro-card rounded-xl p-6"
                  >
                    <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      解谜目标
                    </h3>
                    <p className="font-terminal text-gray-200 leading-relaxed">
                      {displayContent.radioSegment.puzzleObjective}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="retro-card rounded-xl p-6"
                  >
                    <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                      <ListTodo className="w-5 h-5" />
                      玩家操作步骤
                    </h3>
                    <ol className="space-y-3">
                      {displayContent.radioSegment.playerSteps.map((step, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-start gap-3 font-terminal text-gray-200"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-horror-neonGreen/20 border border-horror-neonGreen/50 flex items-center justify-center text-sm text-horror-neonGreen">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </motion.li>
                      ))}
                    </ol>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-4"
                  >
                    <div className="flex-1 p-4 bg-horror-gray/50 rounded-lg border border-horror-lightGray/30">
                      <div className="font-terminal text-xs text-gray-500 mb-1">提取线索</div>
                      <div className="font-horror text-2xl text-horror-neonGreen">
                        {displayContent.clues.length} 条
                      </div>
                    </div>
                    <div className="flex-1 p-4 bg-horror-gray/50 rounded-lg border border-horror-lightGray/30">
                      <div className="font-terminal text-xs text-gray-500 mb-1">关联答案</div>
                      <div className="font-horror text-2xl text-horror-amber">
                        {displayContent.answers.length} 个
                      </div>
                    </div>
                    <div className="flex-1 p-4 bg-horror-gray/50 rounded-lg border border-horror-lightGray/30">
                      <div className="font-terminal text-xs text-gray-500 mb-1">公平性评分</div>
                      <div className={`font-horror text-2xl ${
                        'fairnessScore' in displayContent ? getScoreColor(displayContent.fairnessScore) : 'text-gray-400'
                      }`}>
                        {'fairnessScore' in displayContent ? displayContent.fairnessScore : '-'}
                      </div>
                    </div>
                  </motion.div>

                  {draft?.radioSegment && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="retro-card rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-horror-amber/20 border border-horror-amber/50 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-horror-amber" />
                          </div>
                          <div>
                            <h4 className="font-terminal text-sm text-horror-amber">
                              编剧交付包
                            </h4>
                            <p className="font-terminal text-xs text-gray-500">
                              整理成完整的关卡需求卡，可直接复制为 Markdown
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeliveryPanel(!showDeliveryPanel)}
                            className="px-4 py-2 bg-horror-amber/20 hover:bg-horror-amber/30 border border-horror-amber/50 rounded font-terminal text-sm text-horror-amber transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            查看详情
                          </button>
                          <button
                            onClick={handleCopyDelivery}
                            className={`px-4 py-2 rounded font-terminal text-sm transition-colors flex items-center gap-1 ${
                              copied
                                ? 'bg-horror-neonGreen/30 border border-horror-neonGreen text-horror-neonGreen'
                                : 'bg-horror-neonGreen/20 hover:bg-horror-neonGreen/30 border border-horror-neonGreen/50 text-horror-neonGreen'
                            }`}
                          >
                            {copied ? (
                              <><Check className="w-4 h-4" /> 已复制</>
                            ) : (
                              <><Copy className="w-4 h-4" /> 复制 Markdown</>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!showResult && !isGenerating && versions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="retro-card rounded-xl p-12 text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-6 opacity-30">
                  <Radio className="w-full h-full text-horror-neonGreen" />
                </div>
                <p className="font-terminal text-gray-500">
                  配置好参数后点击生成按钮
                </p>
                <p className="font-terminal text-gray-600 text-sm mt-2">
                  系统将生成电台文本、解谜目标和操作步骤
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showDeliveryPanel && draft?.radioSegment && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-horror-dark border-t border-horror-neonGreen/30 shadow-[0_-5px_30px_rgba(57,255,20,0.2)]"
            >
              <div className="container mx-auto px-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-terminal text-xl text-horror-amber flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    编剧交付包 - 关卡需求卡
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyDelivery}
                      className={`px-4 py-2 rounded font-terminal text-sm transition-colors flex items-center gap-1 ${
                        copied
                          ? 'bg-horror-neonGreen/30 border border-horror-neonGreen text-horror-neonGreen'
                          : 'bg-horror-neonGreen/20 hover:bg-horror-neonGreen/30 border border-horror-neonGreen/50 text-horror-neonGreen'
                      }`}
                    >
                      {copied ? (
                        <><Check className="w-4 h-4" /> 已复制 Markdown</>
                      ) : (
                        <><Copy className="w-4 h-4" /> 一键复制</>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeliveryPanel(false)}
                      className="p-2 hover:bg-horror-gray rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="retro-card rounded-lg p-6 bg-horror-gray/30">
                  <pre className="font-terminal text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {draft && generateDeliveryMarkdown(draft, validateClueChain(draft))}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
