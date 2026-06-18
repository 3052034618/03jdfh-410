import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, MapPin, User, Volume2, AlertTriangle, Plus, X, Sparkles, ArrowRight, Target, ListTodo } from 'lucide-react';
import { usePuzzleStore } from '@/store/puzzleStore';
import { RadioKnob, SpectrumVisualizer, TypewriterText } from '@/components';
import { generateRadioPuzzle, simulateDelay } from '@/utils/radioGenerator';
import { 
  CHAPTER_POSITION_LABELS, 
  BROADCAST_TONE_LABELS, 
  HORROR_INTENSITY_LABELS,
  DEFAULT_KNOWN_INFO_OPTIONS,
  DEFAULT_KEYWORD_SUGGESTIONS,
  type ChapterPosition,
  type BroadcastTone,
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
  } = usePuzzleStore();

  const draft = getCurrentDraft();
  const [keywordInput, setKeywordInput] = useState('');
  const [showKnownInfoDropdown, setShowKnownInfoDropdown] = useState(false);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

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

  const handleGenerate = async () => {
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
    
    setGenerationStep(4);
    await simulateDelay(300);
    setShowResult(true);
    setIsGenerating(false);
  };

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

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleGenerate}
              disabled={isGenerating || generationParams.keywords.length === 0}
              className="w-full py-4 bg-horror-neonGreen/20 hover:bg-horror-neonGreen/30 border-2 border-horror-neonGreen rounded-xl font-terminal text-lg text-horror-neonGreen transition-all duration-300 flex items-center justify-center gap-3 shadow-horror disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="relative w-6 h-6">
                      <div className="absolute inset-0 border-2 border-horror-neonGreen/30 rounded-full" />
                      <div className="absolute inset-0 border-2 border-transparent border-t-horror-neonGreen rounded-full animate-spin" />
                    </div>
                    <span>
                      {steps[generationStep]?.label || '生成中...'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>生成电台谜题</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

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
            <AnimatePresence mode="wait">
              {showResult && draft.radioSegment && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="retro-card rounded-xl p-6 relative overflow-hidden">
                    <div className="static-noise" />
                    <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2 relative z-10">
                      <Radio className="w-5 h-5" />
                      电台文本
                    </h3>
                    <div className="font-terminal text-gray-200 leading-relaxed relative z-10">
                      <TypewriterText
                        text={draft.radioSegment.broadcastText}
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
                      {draft.radioSegment.puzzleObjective}
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
                      {draft.radioSegment.playerSteps.map((step, index) => (
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
                        {draft.clues.length} 条
                      </div>
                    </div>
                    <div className="flex-1 p-4 bg-horror-gray/50 rounded-lg border border-horror-lightGray/30">
                      <div className="font-terminal text-xs text-gray-500 mb-1">关联答案</div>
                      <div className="font-horror text-2xl text-horror-amber">
                        {draft.answers.length} 个
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showResult && !isGenerating && (
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
      </div>
    </div>
  );
}
