import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  PuzzleDraft,
  ChapterPosition,
  BroadcastTone,
  RadioSegment,
  Clue,
  Answer,
  PlayerFeedback,
  GenerationParams,
} from '@/types';
import { generateId } from '@/utils/helpers';

interface PuzzleState {
  drafts: PuzzleDraft[];
  currentDraftId: string | null;
  generationParams: GenerationParams;
  isGenerating: boolean;
  
  getCurrentDraft: () => PuzzleDraft | null;
  createNewDraft: () => void;
  setCurrentDraft: (id: string) => void;
  deleteDraft: (id: string) => void;
  duplicateDraft: (id: string) => void;
  
  setChapterPosition: (position: ChapterPosition) => void;
  addKnownInfo: (info: string) => void;
  removeKnownInfo: (index: number) => void;
  setBroadcastTone: (tone: BroadcastTone) => void;
  setHorrorIntensity: (intensity: 1 | 2 | 3 | 4 | 5) => void;
  addKeyword: (keyword: string) => void;
  removeKeyword: (index: number) => void;
  clearKeywords: () => void;
  
  setRadioSegment: (segment: RadioSegment) => void;
  setClues: (clues: Clue[]) => void;
  updateClue: (id: string, updates: Partial<Clue>) => void;
  addClue: (clue: Omit<Clue, 'id'>) => void;
  removeClue: (id: string) => void;
  
  setAnswers: (answers: Answer[]) => void;
  updateAnswer: (id: string, updates: Partial<Answer>) => void;
  addAnswer: (answer: Omit<Answer, 'id'>) => void;
  removeAnswer: (id: string) => void;
  
  setPlayerFeedback: (feedback: PlayerFeedback[]) => void;
  updatePlayerFeedback: (id: string, updates: Partial<PlayerFeedback>) => void;
  
  setIsGenerating: (isGenerating: boolean) => void;
  resetGenerationParams: () => void;
}

const defaultGenerationParams: GenerationParams = {
  chapterPosition: 'middle',
  playerKnownInfo: [],
  broadcastTone: 'cold',
  horrorIntensity: 3,
  keywords: [],
};

const createEmptyDraft = (): PuzzleDraft => {
  const now = new Date();
  return {
    id: generateId(),
    chapterPosition: 'middle',
    playerKnownInfo: [],
    broadcastTone: 'cold',
    horrorIntensity: 3,
    keywords: [],
    clues: [],
    answers: [],
    playerFeedback: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const usePuzzleStore = create<PuzzleState>()(
  persist(
    (set, get) => ({
      drafts: [],
      currentDraftId: null,
      generationParams: { ...defaultGenerationParams },
      isGenerating: false,
      
      getCurrentDraft: () => {
        const { drafts, currentDraftId } = get();
        return drafts.find(d => d.id === currentDraftId) || null;
      },
      
      createNewDraft: () => {
        const newDraft = createEmptyDraft();
        set(state => ({
          drafts: [...state.drafts, newDraft],
          currentDraftId: newDraft.id,
          generationParams: {
            chapterPosition: newDraft.chapterPosition,
            playerKnownInfo: [...newDraft.playerKnownInfo],
            broadcastTone: newDraft.broadcastTone,
            horrorIntensity: newDraft.horrorIntensity,
            keywords: [...newDraft.keywords],
          },
        }));
      },
      
      setCurrentDraft: (id) => {
        const draft = get().drafts.find(d => d.id === id);
        if (draft) {
          set({
            currentDraftId: id,
            generationParams: {
              chapterPosition: draft.chapterPosition,
              playerKnownInfo: [...draft.playerKnownInfo],
              broadcastTone: draft.broadcastTone,
              horrorIntensity: draft.horrorIntensity,
              keywords: [...draft.keywords],
            },
          });
        }
      },
      
      deleteDraft: (id) => {
        set(state => ({
          drafts: state.drafts.filter(d => d.id !== id),
          currentDraftId: state.currentDraftId === id ? null : state.currentDraftId,
        }));
      },
      
      duplicateDraft: (id) => {
        const draft = get().drafts.find(d => d.id === id);
        if (draft) {
          const newDraft: PuzzleDraft = {
            ...draft,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            clues: draft.clues.map(c => ({ ...c, id: generateId() })),
            answers: draft.answers.map(a => ({ ...a, id: generateId() })),
            playerFeedback: draft.playerFeedback.map(f => ({ ...f, id: generateId() })),
          };
          set(state => ({
            drafts: [...state.drafts, newDraft],
          }));
        }
      },
      
      setChapterPosition: (position) => {
        set(state => {
          const newParams = { ...state.generationParams, chapterPosition: position };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? { ...d, chapterPosition: position, updatedAt: new Date() }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      addKnownInfo: (info) => {
        set(state => {
          const newParams = {
            ...state.generationParams,
            playerKnownInfo: [...state.generationParams.playerKnownInfo, info],
          };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? {
                      ...d,
                      playerKnownInfo: [...d.playerKnownInfo, info],
                      updatedAt: new Date(),
                    }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      removeKnownInfo: (index) => {
        set(state => {
          const newKnownInfo = state.generationParams.playerKnownInfo.filter((_, i) => i !== index);
          const newParams = { ...state.generationParams, playerKnownInfo: newKnownInfo };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? { ...d, playerKnownInfo: newKnownInfo, updatedAt: new Date() }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      setBroadcastTone: (tone) => {
        set(state => {
          const newParams = { ...state.generationParams, broadcastTone: tone };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? { ...d, broadcastTone: tone, updatedAt: new Date() }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      setHorrorIntensity: (intensity) => {
        set(state => {
          const newParams = { ...state.generationParams, horrorIntensity: intensity };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? { ...d, horrorIntensity: intensity, updatedAt: new Date() }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      addKeyword: (keyword) => {
        set(state => {
          const newParams = {
            ...state.generationParams,
            keywords: [...state.generationParams.keywords, keyword],
          };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? { ...d, keywords: [...d.keywords, keyword], updatedAt: new Date() }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      removeKeyword: (index) => {
        set(state => {
          const newKeywords = state.generationParams.keywords.filter((_, i) => i !== index);
          const newParams = { ...state.generationParams, keywords: newKeywords };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? { ...d, keywords: newKeywords, updatedAt: new Date() }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      clearKeywords: () => {
        set(state => {
          const newParams = { ...state.generationParams, keywords: [] };
          const currentDraft = state.drafts.find(d => d.id === state.currentDraftId);
          if (currentDraft) {
            return {
              generationParams: newParams,
              drafts: state.drafts.map(d =>
                d.id === state.currentDraftId
                  ? { ...d, keywords: [], updatedAt: new Date() }
                  : d
              ),
            };
          }
          return { generationParams: newParams };
        });
      },
      
      setRadioSegment: (segment) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? { ...d, radioSegment: segment, updatedAt: new Date() }
              : d
          ),
        }));
      },
      
      setClues: (clues) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? { ...d, clues, updatedAt: new Date() }
              : d
          ),
        }));
      },
      
      updateClue: (id, updates) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  clues: d.clues.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                  ),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },
      
      addClue: (clue) => {
        const newClue = { ...clue, id: generateId() };
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? { ...d, clues: [...d.clues, newClue], updatedAt: new Date() }
              : d
          ),
        }));
      },
      
      removeClue: (id) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  clues: d.clues.filter(c => c.id !== id),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },
      
      setAnswers: (answers) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? { ...d, answers, updatedAt: new Date() }
              : d
          ),
        }));
      },
      
      updateAnswer: (id, updates) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  answers: d.answers.map(a =>
                    a.id === id ? { ...a, ...updates } : a
                  ),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },
      
      addAnswer: (answer) => {
        const newAnswer = { ...answer, id: generateId() };
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? { ...d, answers: [...d.answers, newAnswer], updatedAt: new Date() }
              : d
          ),
        }));
      },
      
      removeAnswer: (id) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  answers: d.answers.filter(a => a.id !== id),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },
      
      setPlayerFeedback: (feedback) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? { ...d, playerFeedback: feedback, updatedAt: new Date() }
              : d
          ),
        }));
      },
      
      updatePlayerFeedback: (id, updates) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  playerFeedback: d.playerFeedback.map(f =>
                    f.id === id ? { ...f, ...updates } : f
                  ),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },
      
      setIsGenerating: (isGenerating) => {
        set({ isGenerating });
      },
      
      resetGenerationParams: () => {
        set({ generationParams: { ...defaultGenerationParams } });
      },
    }),
    {
      name: 'puzzle-draft-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        drafts: state.drafts,
        currentDraftId: state.currentDraftId,
      }),
    }
  )
);
