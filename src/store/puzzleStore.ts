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
  PuzzleVersion,
  ReviewItem,
  VersionReview,
  ReviewRound,
  ReviewConclusion,
} from '@/types';
import { generateId } from '@/utils/helpers';

interface PuzzleState {
  drafts: PuzzleDraft[];
  currentDraftId: string | null;
  generationParams: GenerationParams;
  isGenerating: boolean;
  versions: PuzzleVersion[];
  selectedVersionId: string | null;
  reviewItems: ReviewItem[];
  appliedVersionReview?: VersionReview;
  reviewRounds: ReviewRound[];
  
  getCurrentDraft: () => PuzzleDraft | null;
  getCurrentDraftReviewRounds: () => ReviewRound[];
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
  addClueAnswer: (clueId: string, answerId: string) => void;
  removeClueAnswer: (clueId: string, answerId: string) => void;
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
  
  addVersion: (version: Omit<PuzzleVersion, 'id' | 'versionNumber' | 'createdAt'>) => void;
  selectVersion: (versionId: string) => void;
  applyVersionToDraft: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  clearVersions: () => void;
  updateVersionReview: (versionId: string, review: Partial<VersionReview>) => void;
  
  setReviewItem: (item: ReviewItem) => void;
  clearReviewItems: () => void;
  addReviewRound: (round: Omit<ReviewRound, 'id' | 'reviewDate' | 'draftId'>) => void;
  updateCurrentRoundConclusion: (conclusion: ReviewConclusion, overallComment: string, reviewerName: string) => void;
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
      versions: [],
      selectedVersionId: null,
      reviewItems: [],
      appliedVersionReview: undefined,
      reviewRounds: [],
      
      getCurrentDraft: () => {
        const { drafts, currentDraftId } = get();
        return drafts.find(d => d.id === currentDraftId) || null;
      },

      getCurrentDraftReviewRounds: () => {
        const { reviewRounds, currentDraftId } = get();
        return reviewRounds.filter(r => r.draftId === currentDraftId);
      },
      
      createNewDraft: () => {
        const newDraft = createEmptyDraft();
        set(state => ({
          drafts: [...state.drafts, newDraft],
          currentDraftId: newDraft.id,
          versions: [],
          selectedVersionId: null,
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
            versions: [],
            selectedVersionId: null,
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
          versions: state.currentDraftId === id ? [] : state.versions,
          selectedVersionId: state.currentDraftId === id ? null : state.selectedVersionId,
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
      
      addVersion: (versionData) => {
        set(state => {
          const newVersion: PuzzleVersion = {
            ...versionData,
            id: generateId(),
            versionNumber: state.versions.length + 1,
            createdAt: new Date(),
          };
          return {
            versions: [...state.versions, newVersion],
            selectedVersionId: newVersion.id,
          };
        });
      },
      
      selectVersion: (versionId) => {
        set({ selectedVersionId: versionId });
      },
      
      applyVersionToDraft: (versionId) => {
        const version = get().versions.find(v => v.id === versionId);
        if (!version) return;
        
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  radioSegment: version.radioSegment,
                  clues: version.clues.map(c => ({ ...c })),
                  answers: version.answers.map(a => ({ ...a })),
                  playerFeedback: version.playerFeedback.map(f => ({ ...f })),
                  updatedAt: new Date(),
                }
              : d
          ),
          appliedVersionReview: version.review ? { ...version.review } : undefined,
        }));
      },
      
      deleteVersion: (versionId) => {
        set(state => {
          const newVersions = state.versions.filter(v => v.id !== versionId);
          return {
            versions: newVersions,
            selectedVersionId: state.selectedVersionId === versionId 
              ? (newVersions.length > 0 ? newVersions[newVersions.length - 1].id : null)
              : state.selectedVersionId,
          };
        });
      },
      
      clearVersions: () => {
        set({ versions: [], selectedVersionId: null });
      },

      updateVersionReview: (versionId, review) => {
        set(state => ({
          versions: state.versions.map(v =>
            v.id === versionId
              ? {
                  ...v,
                  review: {
                    versionId,
                    notes: review.notes || v.review?.notes || '',
                    recommendation: review.recommendation || v.review?.recommendation || '',
                    reviewDate: new Date(),
                  },
                }
              : v
          ),
        }));
      },

      setReviewItem: (item) => {
        set(state => {
          const existingIndex = state.reviewItems.findIndex(
            r => r.section === item.section && r.itemKey === item.itemKey
          );
          
          if (existingIndex >= 0) {
            return {
              reviewItems: state.reviewItems.map((r, i) =>
                i === existingIndex ? { ...r, ...item } : r
              ),
            };
          } else {
            return {
              reviewItems: [...state.reviewItems, item],
            };
          }
        });
      },

      clearReviewItems: () => {
        set({ reviewItems: [] });
      },

      addClueAnswer: (clueId, answerId) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  clues: d.clues.map(c => {
                    if (c.id !== clueId) return c;
                    const currentIds = c.answerIds || (c.answerId ? [c.answerId] : []);
                    const newAnswerIds = currentIds.includes(answerId)
                      ? currentIds
                      : [...currentIds, answerId];
                    return {
                      ...c,
                      answerIds: newAnswerIds,
                      answerId: newAnswerIds.length > 0 ? newAnswerIds[0] : undefined,
                    };
                  }),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },

      removeClueAnswer: (clueId, answerId) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === state.currentDraftId
              ? {
                  ...d,
                  clues: d.clues.map(c => {
                    if (c.id !== clueId) return c;
                    const currentIds = c.answerIds || (c.answerId ? [c.answerId] : []);
                    const newAnswerIds = currentIds.filter(id => id !== answerId);
                    return {
                      ...c,
                      answerIds: newAnswerIds.length > 0 ? newAnswerIds : undefined,
                      answerId: newAnswerIds.length > 0 ? newAnswerIds[0] : undefined,
                    };
                  }),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },

      addReviewRound: (roundData: Omit<ReviewRound, 'id' | 'reviewDate' | 'draftId'>) => {
        const { currentDraftId } = get();
        if (!currentDraftId) return;
        
        const newRound: ReviewRound = {
          ...roundData,
          draftId: currentDraftId,
          id: generateId(),
          reviewDate: new Date(),
        };
        set(state => ({
          reviewRounds: [...state.reviewRounds, newRound],
        }));
      },

      updateCurrentRoundConclusion: (conclusion, overallComment, reviewerName) => {
        set(state => ({
          reviewRounds: state.reviewRounds.map(r =>
            r.draftId === state.currentDraftId
              ? {
                  ...r,
                  conclusion,
                  overallComment,
                  reviewerName,
                  reviewDate: new Date(),
                }
              : r
          ),
        }));
      },
    }),
    {
      name: 'puzzle-draft-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        drafts: state.drafts,
        currentDraftId: state.currentDraftId,
        reviewRounds: state.reviewRounds,
      }),
    }
  )
);
