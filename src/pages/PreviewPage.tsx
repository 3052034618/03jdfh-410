import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Eye, EyeOff, AlertTriangle, CheckCircle, XCircle, 
  Radio, ChevronRight, ChevronDown, RotateCcw, Zap 
} from 'lucide-react';
import { usePuzzleStore } from '@/store/puzzleStore';
import { SpectrumVisualizer, TypewriterText, CRTEffect } from '@/components';
import { 
  FEEDBACK_SCENARIO_LABELS, 
  HINT_LEVEL_LABELS,
  ANSWER_TYPE_LABELS,
  type FeedbackScenario,
  type PlayerFeedback,
} from '@/types';

export default function PreviewPage() {
  const { getCurrentDraft } = usePuzzleStore();
  const draft = getCurrentDraft();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<FeedbackScenario>('first_listen');
  const [showAllHints, setShowAllHints] = useState(false);
  const [revealedClueIndex, setRevealedClueIndex] = useState(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0);
  const [showTypewriter, setShowTypewriter] = useState(true);

  const scenarios: { id: FeedbackScenario; icon: any; color: string; desc: string }[] = [
    { id: 'first_listen', icon: Radio, color: 'text-horror-neonGreen', desc: '玩家第一次听到这段广播' },
    { id: 'repeat_listen', icon: RotateCcw, color: 'text-horror-amber', desc: '玩家重复收听后发现新线索' },
    { id: 'failure', icon: XCircle, color: 'text-horror-neonRed', desc: '玩家操作错误触发的反馈' },
    { id: 'success', icon: CheckCircle, color: 'text-horror-cyan', desc: '玩家解谜成功后的反馈' },
  ];

  const currentFeedback = useMemo(() => {
    if (!draft) return null;
    return draft.playerFeedback.find(f => f.scenario === currentScenario);
  }, [draft, currentScenario]);

  const scenarioFeedbacks = useMemo(() => {
    if (!draft) return [];
    return draft.playerFeedback.filter(f => f.scenario === currentScenario);
  }, [draft, currentScenario]);

  useEffect(() => {
    setRevealedClueIndex(-1);
    setCurrentFeedbackIndex(0);
    setShowTypewriter(true);
    setIsPlaying(false);
  }, [currentScenario]);

  useEffect(() => {
    if (isPlaying && draft && revealedClueIndex < draft.clues.length - 1) {
      const timer = setTimeout(() => {
        setRevealedClueIndex(prev => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, revealedClueIndex, draft]);

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <Radio className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="font-terminal text-gray-400">请先在生成页面创建一个谜题</p>
        </div>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (revealedClueIndex >= draft.clues.length - 1) {
      setRevealedClueIndex(-1);
      setShowTypewriter(true);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setRevealedClueIndex(-1);
    setShowTypewriter(true);
    setIsPlaying(false);
    setCurrentFeedbackIndex(0);
  };

  const handleNextClue = () => {
    if (revealedClueIndex < draft.clues.length - 1) {
      setRevealedClueIndex(prev => prev + 1);
    }
  };

  const handlePrevClue = () => {
    if (revealedClueIndex >= 0) {
      setRevealedClueIndex(prev => prev - 1);
    }
  };

  const getVisualEffectClass = (effect: string): string => {
    switch (effect) {
      case 'static': return 'static-noise';
      case 'glitch': return 'glitch-text';
      case 'flicker': return 'animate-flicker';
      case 'pulse': return 'animate-pulse-slow';
      default: return '';
    }
  };

  const getScenarioBorderColor = (scenario: FeedbackScenario): string => {
    switch (scenario) {
      case 'first_listen': return 'border-horror-neonGreen/30';
      case 'repeat_listen': return 'border-horror-amber/30';
      case 'failure': return 'border-horror-neonRed/30';
      case 'success': return 'border-horror-cyan/30';
      default: return 'border-gray-600/30';
    }
  };

  const getScenarioBgColor = (scenario: FeedbackScenario): string => {
    switch (scenario) {
      case 'first_listen': return 'bg-horror-neonGreen/5';
      case 'repeat_listen': return 'bg-horror-amber/5';
      case 'failure': return 'bg-horror-neonRed/5';
      case 'success': return 'bg-horror-cyan/5';
      default: return 'bg-gray-800/50';
    }
  };

  const progress = draft.clues.length > 0 
    ? ((revealedClueIndex + 1) / draft.clues.length) * 100 
    : 0;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h2 className="font-horror text-4xl text-horror-neonGreen mb-2 text-shadow-glow">
            结局提示预览
          </h2>
          <p className="font-terminal text-gray-400">
            以玩家视角逐步体验谜题，判断线索是否公平合理
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`retro-card rounded-xl overflow-hidden ${getScenarioBgColor(currentScenario)} border ${getScenarioBorderColor(currentScenario)}`}
            >
              <div className="relative">
                <CRTEffect enabled showScanlines showNoise intensity="medium" />
                
                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {scenarios.find(s => s.id === currentScenario)?.icon && 
                        React.createElement(scenarios.find(s => s.id === currentScenario)!.icon, {
                          className: `w-6 h-6 ${scenarios.find(s => s.id === currentScenario)?.color}`
                        })
                      }
                      <span className={`font-terminal text-lg ${scenarios.find(s => s.id === currentScenario)?.color}`}>
                        {FEEDBACK_SCENARIO_LABELS[currentScenario]}
                      </span>
                    </div>
                    <SpectrumVisualizer 
                      active={isPlaying && !isMuted} 
                      barCount={12} 
                      color={currentScenario === 'failure' ? '#ff003c' : '#39ff14'}
                      height={40}
                      intensity={0.8}
                    />
                  </div>

                  <div className="bg-black/40 rounded-lg p-6 mb-6 min-h-[200px] border border-gray-700/50">
                    {currentFeedback ? (
                      <div className={getVisualEffectClass(currentFeedback.visualEffect)}>
                        {showTypewriter ? (
                          <TypewriterText
                            text={currentFeedback.feedbackText}
                            speed={30}
                            delay={500}
                            className="font-terminal text-gray-200 leading-relaxed text-lg"
                            showCursor
                            cursorColor={currentScenario === 'failure' ? '#ff003c' : '#39ff14'}
                            onComplete={() => setShowTypewriter(false)}
                          />
                        ) : (
                          <p className="font-terminal text-gray-200 leading-relaxed text-lg">
                            {currentFeedback.feedbackText}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-terminal text-gray-500 text-center py-8">
                        该场景暂无反馈内容
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-600"
                        title="重置"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handlePrevClue}
                        disabled={revealedClueIndex < 0}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="上一条线索"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handlePlayPause}
                        className={`p-4 rounded-full transition-all border ${
                          isPlaying 
                            ? 'bg-horror-neonRed/20 border-horror-neonRed/50 text-horror-neonRed hover:bg-horror-neonRed/30' 
                            : 'bg-horror-neonGreen/20 border-horror-neonGreen/50 text-horror-neonGreen hover:bg-horror-neonGreen/30'
                        }`}
                        title={isPlaying ? '暂停' : '播放'}
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                      </button>
                      <button
                        onClick={handleNextClue}
                        disabled={revealedClueIndex >= draft.clues.length - 1}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="下一条线索"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-600"
                        title={isMuted ? '取消静音' : '静音'}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="font-terminal text-gray-400 text-sm">
                        线索 {Math.max(0, revealedClueIndex + 1)} / {draft.clues.length}
                      </div>
                      <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <motion.div
                          className={`h-full ${
                            currentScenario === 'failure' ? 'bg-horror-neonRed' : 'bg-horror-neonGreen'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="retro-card rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-terminal text-lg text-horror-neonGreen flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  逐步揭示的线索
                </h3>
                <button
                  onClick={() => setShowAllHints(!showAllHints)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-terminal transition-colors border border-gray-600"
                >
                  {showAllHints ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAllHints ? '隐藏全部' : '显示全部'}
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {draft.clues.map((clue, index) => {
                    const isRevealed = showAllHints || index <= revealedClueIndex;
                    const isCurrent = index === revealedClueIndex;
                    
                    return (
                      <motion.div
                        key={clue.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: isRevealed ? 1 : 0.3, 
                          x: 0,
                          scale: isCurrent ? 1.02 : 1
                        }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border transition-all ${
                          isCurrent 
                            ? 'bg-horror-neonGreen/10 border-horror-neonGreen/50 shadow-[0_0_15px_#39ff14]' 
                            : isRevealed 
                              ? 'bg-gray-800/50 border-gray-600/50' 
                              : 'bg-gray-900/50 border-gray-700/30'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isRevealed 
                              ? 'bg-horror-neonGreen/20 text-horror-neonGreen border border-horror-neonGreen/50' 
                              : 'bg-gray-800 text-gray-600 border border-gray-700'
                          }`}>
                            {isRevealed ? index + 1 : '?'}
                          </div>
                          <div className="flex-1">
                            {isRevealed ? (
                              <>
                                <p className="font-terminal text-gray-200 mb-2">{clue.content}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-xs font-terminal border ${
                                    clue.hintLevel === 'subtle' 
                                      ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' 
                                      : clue.hintLevel === 'moderate' 
                                        ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' 
                                        : 'bg-green-900/30 text-green-400 border-green-500/30'
                                  }`}>
                                    {HINT_LEVEL_LABELS[clue.hintLevel]}
                                  </span>
                                  {clue.answerId && (
                                    <span className="px-2 py-0.5 rounded text-xs font-terminal bg-purple-900/30 text-purple-400 border border-purple-500/30">
                                      关联答案: {draft.answers.find(a => a.id === clue.answerId)?.value || '未知'}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="font-terminal text-gray-600 italic">线索尚未揭示...</p>
                            )}
                          </div>
                          {isCurrent && (
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                            >
                              <ChevronRight className="w-5 h-5 text-horror-neonGreen" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {draft.clues.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="font-terminal text-gray-500">暂无线索数据</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                场景切换
              </h3>
              <div className="space-y-2">
                {scenarios.map((scenario) => {
                  const Icon = scenario.icon;
                  const isActive = currentScenario === scenario.id;
                  const feedbackCount = draft.playerFeedback.filter(f => f.scenario === scenario.id).length;
                  
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => setCurrentScenario(scenario.id)}
                      className={`w-full p-4 rounded-lg text-left transition-all border ${
                        isActive 
                          ? `${getScenarioBgColor(scenario.id)} ${getScenarioBorderColor(scenario.id)} shadow-lg` 
                          : 'bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50 hover:border-gray-600/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Icon className={`w-5 h-5 ${isActive ? scenario.color : 'text-gray-500'}`} />
                        <span className={`font-terminal font-bold ${isActive ? scenario.color : 'text-gray-300'}`}>
                          {FEEDBACK_SCENARIO_LABELS[scenario.id]}
                        </span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                          feedbackCount > 0 
                            ? 'bg-horror-neonGreen/20 text-horror-neonGreen' 
                            : 'bg-gray-700/50 text-gray-500'
                        }`}>
                          {feedbackCount} 条
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-terminal ml-8">{scenario.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                正确答案
              </h3>
              <div className="space-y-3">
                {draft.answers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-terminal bg-cyan-900/30 text-cyan-400 border border-cyan-500/30">
                        {ANSWER_TYPE_LABELS[answer.type]}
                      </span>
                      <span className="font-terminal text-horror-neonGreen font-bold text-lg">
                        {answer.value}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 font-terminal">{answer.description}</p>
                    <div className="mt-2 pt-2 border-t border-gray-700/50">
                      <span className="text-xs text-gray-500 font-terminal">
                        关联线索: {draft.clues.filter(c => c.answerId === answer.id).length} 条
                      </span>
                    </div>
                  </div>
                ))}

                {draft.answers.length === 0 && (
                  <div className="text-center py-6">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="font-terminal text-gray-500 text-sm">暂无答案数据</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="retro-card rounded-xl p-6"
            >
              <h3 className="font-terminal text-lg text-horror-neonGreen mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                公平性评估
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-terminal text-sm text-gray-400">线索明显度分布</span>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div 
                      className="bg-blue-500 rounded-l" 
                      style={{ width: `${(draft.clues.filter(c => c.hintLevel === 'subtle').length / Math.max(draft.clues.length, 1)) * 100}%` }}
                      title="隐晦"
                    />
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${(draft.clues.filter(c => c.hintLevel === 'moderate').length / Math.max(draft.clues.length, 1)) * 100}%` }}
                      title="适中"
                    />
                    <div 
                      className="bg-green-500 rounded-r" 
                      style={{ width: `${(draft.clues.filter(c => c.hintLevel === 'obvious').length / Math.max(draft.clues.length, 1)) * 100}%` }}
                      title="明显"
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs font-terminal text-gray-500">
                    <span>隐晦 {draft.clues.filter(c => c.hintLevel === 'subtle').length}</span>
                    <span>适中 {draft.clues.filter(c => c.hintLevel === 'moderate').length}</span>
                    <span>明显 {draft.clues.filter(c => c.hintLevel === 'obvious').length}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <p className="font-terminal text-sm text-gray-300 mb-2">设计建议</p>
                  <ul className="space-y-1 text-xs text-gray-500 font-terminal">
                    {draft.clues.filter(c => c.hintLevel === 'obvious').length === 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-horror-amber">•</span>
                        建议增加至少1条明显线索，避免玩家卡关
                      </li>
                    )}
                    {draft.clues.filter(c => c.hintLevel === 'subtle').length > draft.clues.length / 2 && (
                      <li className="flex items-start gap-2">
                        <span className="text-horror-amber">•</span>
                        隐晦线索过多（{draft.clues.filter(c => c.hintLevel === 'subtle').length}条），可能导致谜题过难
                      </li>
                    )}
                    {draft.playerFeedback.filter(f => f.scenario === 'failure').length === 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-horror-amber">•</span>
                        缺少失败场景反馈，建议添加错误操作后的提示
                      </li>
                    )}
                    {draft.clues.length < 3 && draft.clues.length > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-horror-amber">•</span>
                        线索较少（{draft.clues.length}条），考虑增加更多层次的暗示
                      </li>
                    )}
                    {draft.clues.every(c => c.answerId) && draft.clues.length > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-horror-neonGreen">•</span>
                        所有线索都已关联答案，逻辑完整
                      </li>
                    )}
                    {draft.clues.some(c => !c.answerId) && (
                      <li className="flex items-start gap-2">
                        <span className="text-horror-neonRed">•</span>
                        有{draft.clues.filter(c => !c.answerId).length}条线索未关联答案
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
