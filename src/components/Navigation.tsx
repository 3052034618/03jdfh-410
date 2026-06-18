import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Search, Eye, Plus, List, Copy, Trash2 } from 'lucide-react';
import { usePuzzleStore } from '@/store/puzzleStore';
import { formatDate } from '@/utils/helpers';
import { useState } from 'react';

export const Navigation = () => {
  const location = useLocation();
  const { drafts, currentDraftId, createNewDraft, setCurrentDraft, deleteDraft, duplicateDraft } = usePuzzleStore();
  const [showDrafts, setShowDrafts] = useState(false);

  const navItems = [
    { path: '/', label: '电台生成', icon: Radio },
    { path: '/clues', label: '线索检查', icon: Search },
    { path: '/preview', label: '预览结局', icon: Eye },
  ];

  const handleCreateNew = () => {
    createNewDraft();
    setShowDrafts(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-horror-black/90 backdrop-blur-sm border-b border-horror-lightGray/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="w-8 h-8 text-horror-neonGreen animate-pulse-slow" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-horror-neonRed rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="font-horror text-2xl text-horror-neonGreen tracking-wider text-shadow-glow">
                阴间电台
              </h1>
              <p className="font-terminal text-xs text-horror-lightGray/70 -mt-1">
                谜题草稿台 v1.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 font-terminal text-sm transition-all duration-300 hover:text-horror-neonGreen ${
                    location.pathname === item.path
                      ? 'text-horror-neonGreen'
                      : 'text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-horror-neonGreen"
                      style={{ boxShadow: '0 0 10px #39ff14' }}
                    />
                  )}
                </NavLink>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                className="flex items-center gap-2 px-4 py-2 bg-horror-gray hover:bg-horror-lightGray border border-horror-lightGray/50 rounded font-terminal text-sm transition-all duration-300 hover:border-horror-neonGreen/50"
              >
                <List className="w-4 h-4 text-horror-neonGreen" />
                <span className="text-gray-300">草稿</span>
                <span className="text-horror-neonGreen">({drafts.length})</span>
              </button>

              {showDrafts && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-horror-dark border border-horror-lightGray/50 rounded-lg shadow-horror overflow-hidden"
                >
                  <div className="p-3 border-b border-horror-lightGray/30">
                    <button
                      onClick={handleCreateNew}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-horror-neonGreen/20 hover:bg-horror-neonGreen/30 border border-horror-neonGreen/50 rounded font-terminal text-sm text-horror-neonGreen transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                      <span>创建新草稿</span>
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto scrollbar-horror">
                    {drafts.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 font-terminal text-sm">
                        暂无草稿，点击上方创建
                      </div>
                    ) : (
                      drafts.map((draft) => (
                        <div
                          key={draft.id}
                          className={`p-3 border-b border-horror-lightGray/20 cursor-pointer transition-all duration-200 ${
                            currentDraftId === draft.id
                              ? 'bg-horror-neonGreen/10 border-l-2 border-l-horror-neonGreen'
                              : 'hover:bg-horror-gray/50'
                          }`}
                          onClick={() => {
                            setCurrentDraft(draft.id);
                            setShowDrafts(false);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-terminal text-sm text-gray-200 truncate">
                                {draft.keywords.length > 0
                                  ? draft.keywords.join(' · ')
                                  : '未命名草稿'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(draft.updatedAt)}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 bg-horror-gray rounded text-gray-400">
                                  {draft.keywords.length} 关键词
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-horror-gray rounded text-gray-400">
                                  {draft.clues.length} 线索
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateDraft(draft.id);
                                }}
                                className="p-1.5 hover:bg-horror-lightGray rounded transition-colors"
                                title="复制草稿"
                              >
                                <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-horror-neonGreen" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('确定要删除这个草稿吗？')) {
                                    deleteDraft(draft.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-horror-red/30 rounded transition-colors"
                                title="删除草稿"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-horror-neonRed" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
