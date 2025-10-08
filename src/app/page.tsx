'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Home as HomeIcon, Building, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Memo, MemoFormData, FilterOptions } from '@/types/memo';
import { getMemos, createMemo, updateMemo, deleteMemo, searchMemos, filterMemos } from '@/lib/memo-storage';

const CATEGORIES = [
  '매물 정보', '고객 정보', '계약 관련', '시세 정보', '기타'
];

const PROPERTY_TYPES = [
  '아파트', '빌라', '단독주택', '오피스텔', '상가', '사무실', '공장', '창고', '토지', '기타'
];

const PRIORITIES = [
  { value: 'high', label: '높음', color: 'text-red-600' },
  { value: 'medium', label: '보통', color: 'text-yellow-600' },
  { value: 'low', label: '낮음', color: 'text-green-600' }
];

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    propertyType: '',
    priority: ''
  });

  // 폼 데이터 상태
  const [formData, setFormData] = useState<MemoFormData>({
    title: '',
    content: '',
    category: '',
    propertyType: '',
    location: '',
    priority: 'medium'
  });

  // 메모 데이터 로드
  useEffect(() => {
    const loadedMemos = getMemos();
    setMemos(loadedMemos);
    setFilteredMemos(loadedMemos);
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = memos;

    // 검색어 필터링
    if (filters.search) {
      filtered = searchMemos(filters.search, filtered);
    }

    // 카테고리, 부동산 유형, 우선순위 필터링
    filtered = filterMemos(filtered, {
      category: filters.category || undefined,
      propertyType: filters.propertyType || undefined,
      priority: filters.priority || undefined
    });

    setFilteredMemos(filtered);
  }, [memos, filters]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      propertyType: '',
      location: '',
      priority: 'medium'
    });
    setEditingMemo(null);
  };

  // 새 메모 생성
  const handleCreateMemo = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 메모 수정
  const handleEditMemo = (memo: Memo) => {
    setFormData({
      title: memo.title,
      content: memo.content,
      category: memo.category,
      propertyType: memo.propertyType,
      location: memo.location,
      priority: memo.priority
    });
    setEditingMemo(memo);
    setIsDialogOpen(true);
  };

  // 메모 저장
  const handleSaveMemo = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (editingMemo) {
      // 수정
      const updatedMemo = updateMemo(editingMemo.id, formData);
      if (updatedMemo) {
        setMemos(getMemos());
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      // 생성
      createMemo(formData);
      setMemos(getMemos());
      setIsDialogOpen(false);
      resetForm();
    }
  };

  // 메모 삭제
  const handleDeleteMemo = (id: string) => {
    if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      if (deleteMemo(id)) {
        setMemos(getMemos());
      }
    }
  };

  // 필터 변경
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 우선순위 색상 가져오기
  const getPriorityColor = (priority: string) => {
    const priorityObj = PRIORITIES.find(p => p.value === priority);
    return priorityObj?.color || 'text-gray-600';
  };

  // 우선순위 라벨 가져오기
  const getPriorityLabel = (priority: string) => {
    const priorityObj = PRIORITIES.find(p => p.value === priority);
    return priorityObj?.label || priority;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">공인중개사 메모 관리</h1>
            </div>
            <Button onClick={handleCreateMemo} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              새 메모
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="메모 검색..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 카테고리 필터 */}
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 부동산 유형 필터 */}
            <Select value={filters.propertyType} onValueChange={(value) => handleFilterChange('propertyType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="부동산 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 우선순위 필터 */}
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="우선순위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {PRIORITIES.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 메모 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemos.map((memo) => (
            <div key={memo.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{memo.title}</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMemo(memo)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMemo(memo.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{memo.content}</p>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Building className="h-4 w-4 mr-2" />
                    {memo.category} • {memo.propertyType}
                  </div>
                  {memo.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {memo.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Star className={`h-4 w-4 mr-2 ${getPriorityColor(memo.priority)}`} />
                    <span className={getPriorityColor(memo.priority)}>
                      {getPriorityLabel(memo.priority)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-gray-400">
                  {new Date(memo.updatedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMemos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <HomeIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">메모가 없습니다</h3>
            <p className="text-gray-500 mb-4">새 메모를 작성해보세요.</p>
            <Button onClick={handleCreateMemo} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              새 메모 작성
            </Button>
          </div>
        )}
      </div>

      {/* 메모 작성/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMemo ? '메모 수정' : '새 메모 작성'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="메모 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="메모 내용을 입력하세요"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">부동산 유형</label>
                <Select value={formData.propertyType} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="부동산 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">위치</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="위치 정보"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                <Select value={formData.priority} onValueChange={(value: 'high' | 'medium' | 'low') => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="우선순위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveMemo} className="bg-blue-600 hover:bg-blue-700">
              {editingMemo ? '수정' : '저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}