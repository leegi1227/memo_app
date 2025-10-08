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
  const [isClient, setIsClient] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    propertyType: 'all',
    priority: 'all'
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

  // 클라이언트 사이드 확인
  useEffect(() => {
    console.log('클라이언트 사이드 초기화');
    setIsClient(true);
  }, []);

  // 메모 데이터 로드
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const loadedMemos = getMemos();
      setMemos(loadedMemos);
      setFilteredMemos(loadedMemos);
      console.log('메모 데이터 로드됨:', loadedMemos.length, '개');
    } catch (error) {
      console.error('메모 데이터 로드 중 오류:', error);
      setMemos([]);
      setFilteredMemos([]);
    }
  }, [isClient]);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = memos;

    // 검색어 필터링
    if (filters.search) {
      filtered = searchMemos(filters.search, filtered);
    }

    // 카테고리, 부동산 유형, 우선순위 필터링
    filtered = filterMemos(filtered, {
      category: filters.category && filters.category !== 'all' ? filters.category : undefined,
      propertyType: filters.propertyType && filters.propertyType !== 'all' ? filters.propertyType : undefined,
      priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined
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

    try {
      if (editingMemo) {
        // 수정
        console.log('메모 수정 시도:', editingMemo.id, formData);
        const updatedMemo = updateMemo(editingMemo.id, formData);
        if (updatedMemo) {
          console.log('메모 수정 완료:', updatedMemo);
          setMemos(getMemos());
          setIsDialogOpen(false);
          resetForm();
          alert('메모가 수정되었습니다.');
        } else {
          alert('메모 수정에 실패했습니다.');
        }
      } else {
        // 생성
        console.log('새 메모 생성 시도:', formData);
        const newMemo = createMemo(formData);
        console.log('새 메모 생성 완료:', newMemo);
        setMemos(getMemos());
        setIsDialogOpen(false);
        resetForm();
        alert('메모가 저장되었습니다.');
      }
    } catch (error) {
      console.error('메모 저장 중 오류:', error);
      alert('메모 저장 중 오류가 발생했습니다.');
    }
  };

  // 메모 삭제
  const handleDeleteMemo = (id: string) => {
    if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      try {
        console.log('메모 삭제 시도:', id);
        if (deleteMemo(id)) {
          console.log('메모 삭제 완료:', id);
          setMemos(getMemos());
          alert('메모가 삭제되었습니다.');
        } else {
          alert('메모 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('메모 삭제 중 오류:', error);
        alert('메모 삭제 중 오류가 발생했습니다.');
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

  // 클라이언트 사이드가 아닌 경우 로딩 표시
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto mb-6"></div>
          <p className="text-white text-lg font-medium">애플리케이션을 로딩 중...</p>
          <p className="text-gray-300 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 헤더 */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 mr-4">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                공인중개사 메모 관리
              </h1>
            </div>
            <Button 
              onClick={handleCreateMemo} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              새 메모
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
              <Input
                placeholder="메모 검색..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 focus:border-purple-400 rounded-xl h-12"
              />
            </div>

            {/* 카테고리 필터 */}
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 focus:border-purple-400 rounded-xl h-12">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20 text-white">
                <SelectItem value="all" className="text-white hover:bg-purple-600">전체</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category} className="text-white hover:bg-purple-600">{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 부동산 유형 필터 */}
            <Select value={filters.propertyType} onValueChange={(value) => handleFilterChange('propertyType', value)}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 focus:border-purple-400 rounded-xl h-12">
                <SelectValue placeholder="부동산 유형" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20 text-white">
                <SelectItem value="all" className="text-white hover:bg-purple-600">전체</SelectItem>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="text-white hover:bg-purple-600">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 우선순위 필터 */}
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 focus:border-purple-400 rounded-xl h-12">
                <SelectValue placeholder="우선순위" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20 text-white">
                <SelectItem value="all" className="text-white hover:bg-purple-600">전체</SelectItem>
                {PRIORITIES.map(priority => (
                  <SelectItem key={priority.value} value={priority.value} className="text-white hover:bg-purple-600">{priority.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 메모 목록 */}
        <div className="mb-4 text-white">
          <p>총 메모 개수: {memos.length}개, 필터링된 메모: {filteredMemos.length}개</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMemos.map((memo) => (
            <div key={memo.id} className="backdrop-blur-md bg-white/10 rounded-2xl shadow-2xl border border-white/20 hover:bg-white/20 hover:shadow-3xl transition-all duration-300 transform hover:scale-105 group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white overflow-hidden group-hover:text-purple-200 transition-colors" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>{memo.title}</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMemo(memo)}
                      className="text-white hover:bg-purple-600/50 rounded-lg p-2"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMemo(memo.id)}
                      className="text-white hover:bg-red-600/50 rounded-lg p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-200 text-sm mb-6 overflow-hidden leading-relaxed" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}>{memo.content}</p>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-purple-200">
                    <Building className="h-4 w-4 mr-2" />
                    {memo.category} • {memo.propertyType}
                  </div>
                  {memo.location && (
                    <div className="flex items-center text-sm text-purple-200">
                      <MapPin className="h-4 w-4 mr-2" />
                      {memo.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Star className={`h-4 w-4 mr-2 ${getPriorityColor(memo.priority)}`} />
                    <span className={`${getPriorityColor(memo.priority)} font-medium`}>
                      {getPriorityLabel(memo.priority)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/20 text-xs text-gray-300">
                  {new Date(memo.updatedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMemos.length === 0 && (
          <div className="text-center py-20">
            <div className="text-purple-400 mb-6">
              <HomeIcon className="h-20 w-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">메모가 없습니다</h3>
            <p className="text-gray-300 mb-8 text-lg">새 메모를 작성해보세요.</p>
            <Button 
              onClick={handleCreateMemo} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              새 메모 작성
            </Button>
          </div>
        )}
      </div>

      {/* 메모 작성/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-800 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingMemo ? '메모 수정' : '새 메모 작성'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-3">제목 *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="메모 제목을 입력하세요"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-400 rounded-xl h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-3">내용 *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="메모 내용을 입력하세요"
                rows={4}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-400 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-3">카테고리</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white focus:border-purple-400 rounded-xl h-12">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category} className="text-white hover:bg-purple-600">{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-3">부동산 유형</label>
                <Select value={formData.propertyType} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white focus:border-purple-400 rounded-xl h-12">
                    <SelectValue placeholder="부동산 유형 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {PROPERTY_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="text-white hover:bg-purple-600">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-3">위치</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="위치 정보"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-400 rounded-xl h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-3">우선순위</label>
                <Select value={formData.priority} onValueChange={(value: 'high' | 'medium' | 'low') => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white focus:border-purple-400 rounded-xl h-12">
                    <SelectValue placeholder="우선순위 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value} className="text-white hover:bg-purple-600">{priority.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl px-6 py-3"
            >
              취소
            </Button>
            <Button 
              onClick={handleSaveMemo} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {editingMemo ? '수정' : '저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}