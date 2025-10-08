// 메모 데이터 저장소 관리
import { Memo, MemoFormData } from '@/types/memo';

const STORAGE_KEY = 'memo-app-data';

// 로컬 스토리지에서 메모 데이터 가져오기
export function getMemos(): Memo[] {
  if (typeof window === 'undefined') return [];
  
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
    return [];
  } catch (error) {
    console.error('메모 데이터를 불러오는 중 오류 발생:', error);
    return [];
  }
}

// 로컬 스토리지에 메모 데이터 저장
export function saveMemos(memos: Memo[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    }
  } catch (error) {
    console.error('메모 데이터를 저장하는 중 오류 발생:', error);
  }
}

// 새 메모 생성
export function createMemo(formData: MemoFormData): Memo {
  const now = new Date().toISOString();
  const newMemo: Memo = {
    id: Date.now().toString(),
    ...formData,
    createdAt: now,
    updatedAt: now,
  };
  
  const memos = getMemos();
  memos.unshift(newMemo); // 최신 메모를 맨 위에 추가
  saveMemos(memos);
  
  return newMemo;
}

// 메모 수정
export function updateMemo(id: string, formData: MemoFormData): Memo | null {
  const memos = getMemos();
  const index = memos.findIndex(memo => memo.id === id);
  
  if (index === -1) return null;
  
  const updatedMemo: Memo = {
    ...memos[index],
    ...formData,
    updatedAt: new Date().toISOString(),
  };
  
  memos[index] = updatedMemo;
  saveMemos(memos);
  
  return updatedMemo;
}

// 메모 삭제
export function deleteMemo(id: string): boolean {
  const memos = getMemos();
  const filteredMemos = memos.filter(memo => memo.id !== id);
  
  if (filteredMemos.length === memos.length) return false;
  
  saveMemos(filteredMemos);
  return true;
}

// 메모 검색
export function searchMemos(query: string, memos: Memo[]): Memo[] {
  if (!query.trim()) return memos;
  
  const lowercaseQuery = query.toLowerCase();
  return memos.filter(memo => 
    memo.title.toLowerCase().includes(lowercaseQuery) ||
    memo.content.toLowerCase().includes(lowercaseQuery) ||
    memo.category.toLowerCase().includes(lowercaseQuery) ||
    memo.location.toLowerCase().includes(lowercaseQuery)
  );
}

// 메모 필터링
export function filterMemos(memos: Memo[], filters: {
  category?: string;
  propertyType?: string;
  priority?: string;
}): Memo[] {
  return memos.filter(memo => {
    if (filters.category && memo.category !== filters.category) return false;
    if (filters.propertyType && memo.propertyType !== filters.propertyType) return false;
    if (filters.priority && memo.priority !== filters.priority) return false;
    return true;
  });
}
