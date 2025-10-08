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
  
  console.log('새 메모 생성:', newMemo);
  const memos = getMemos();
  console.log('기존 메모 개수:', memos.length);
  memos.unshift(newMemo); // 최신 메모를 맨 위에 추가
  console.log('메모 추가 후 개수:', memos.length);
  saveMemos(memos);
  console.log('메모 저장 완료');
  
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
  console.log('메모 삭제 시도:', id);
  const memos = getMemos();
  console.log('삭제 전 메모 개수:', memos.length);
  const filteredMemos = memos.filter(memo => memo.id !== id);
  console.log('삭제 후 메모 개수:', filteredMemos.length);
  
  if (filteredMemos.length === memos.length) {
    console.log('삭제할 메모를 찾을 수 없음');
    return false;
  }
  
  saveMemos(filteredMemos);
  console.log('메모 삭제 완료');
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
