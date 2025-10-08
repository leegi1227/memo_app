// 메모 데이터 타입 정의
export interface Memo {
  id: string;
  title: string;
  content: string;
  category: string;
  propertyType: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

// 메모 생성/수정을 위한 타입
export interface MemoFormData {
  title: string;
  content: string;
  category: string;
  propertyType: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
}

// 필터 옵션 타입
export interface FilterOptions {
  search: string;
  category: string;
  propertyType: string;
  priority: string;
}
