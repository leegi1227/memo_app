"""
메모 데이터 모델 클래스
공인중개사용 메모의 데이터 구조를 정의합니다.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
import os


class MemoModel:
    """메모 데이터를 관리하는 모델 클래스"""
    
    def __init__(self, file_path: str = "memos.json"):
        """
        메모 모델 초기화
        
        Args:
            file_path (str): 메모 데이터를 저장할 JSON 파일 경로
        """
        self.file_path = file_path
        self.memos: List[Dict[str, Any]] = []
        self.load_memos()
    
    def load_memos(self) -> None:
        """JSON 파일에서 메모 데이터를 로드합니다."""
        try:
            if os.path.exists(self.file_path):
                with open(self.file_path, 'r', encoding='utf-8') as file:
                    self.memos = json.load(file)
            else:
                self.memos = []
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"메모 로드 중 오류 발생: {e}")
            self.memos = []
    
    def save_memos(self) -> bool:
        """메모 데이터를 JSON 파일에 저장합니다."""
        try:
            with open(self.file_path, 'w', encoding='utf-8') as file:
                json.dump(self.memos, file, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"메모 저장 중 오류 발생: {e}")
            return False
    
    def create_memo(self, title: str, content: str, category: str = "", 
                   priority: str = "보통", property_type: str = "", 
                   location: str = "") -> Dict[str, Any]:
        """
        새 메모를 생성합니다.
        
        Args:
            title (str): 메모 제목
            content (str): 메모 내용
            category (str): 카테고리
            priority (str): 우선순위
            property_type (str): 부동산 유형
            location (str): 위치
            
        Returns:
            Dict[str, Any]: 생성된 메모 데이터
        """
        memo = {
            "id": len(self.memos) + 1,
            "title": title,
            "content": content,
            "category": category,
            "priority": priority,
            "property_type": property_type,
            "location": location,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        self.memos.append(memo)
        self.save_memos()
        return memo
    
    def update_memo(self, memo_id: int, **kwargs) -> bool:
        """
        메모를 업데이트합니다.
        
        Args:
            memo_id (int): 업데이트할 메모 ID
            **kwargs: 업데이트할 필드들
            
        Returns:
            bool: 업데이트 성공 여부
        """
        for memo in self.memos:
            if memo["id"] == memo_id:
                for key, value in kwargs.items():
                    if key in memo:
                        memo[key] = value
                memo["updated_at"] = datetime.now().isoformat()
                self.save_memos()
                return True
        return False
    
    def delete_memo(self, memo_id: int) -> bool:
        """
        메모를 삭제합니다.
        
        Args:
            memo_id (int): 삭제할 메모 ID
            
        Returns:
            bool: 삭제 성공 여부
        """
        for i, memo in enumerate(self.memos):
            if memo["id"] == memo_id:
                del self.memos[i]
                self.save_memos()
                return True
        return False
    
    def get_memo(self, memo_id: int) -> Optional[Dict[str, Any]]:
        """
        특정 메모를 가져옵니다.
        
        Args:
            memo_id (int): 가져올 메모 ID
            
        Returns:
            Optional[Dict[str, Any]]: 메모 데이터 또는 None
        """
        for memo in self.memos:
            if memo["id"] == memo_id:
                return memo
        return None
    
    def get_all_memos(self) -> List[Dict[str, Any]]:
        """
        모든 메모를 가져옵니다.
        
        Returns:
            List[Dict[str, Any]]: 모든 메모 리스트
        """
        return self.memos.copy()
    
    def search_memos(self, query: str) -> List[Dict[str, Any]]:
        """
        메모를 검색합니다.
        
        Args:
            query (str): 검색 쿼리
            
        Returns:
            List[Dict[str, Any]]: 검색된 메모 리스트
        """
        if not query.strip():
            return self.get_all_memos()
        
        query_lower = query.lower()
        results = []
        
        for memo in self.memos:
            if (query_lower in memo["title"].lower() or 
                query_lower in memo["content"].lower() or
                query_lower in memo["category"].lower() or
                query_lower in memo["property_type"].lower() or
                query_lower in memo["location"].lower()):
                results.append(memo)
        
        return results
    
    def get_categories(self) -> List[str]:
        """사용된 모든 카테고리를 가져옵니다."""
        categories = set()
        for memo in self.memos:
            if memo["category"]:
                categories.add(memo["category"])
        return sorted(list(categories))
    
    def get_property_types(self) -> List[str]:
        """사용된 모든 부동산 유형을 가져옵니다."""
        property_types = set()
        for memo in self.memos:
            if memo["property_type"]:
                property_types.add(memo["property_type"])
        return sorted(list(property_types))
    
    def get_locations(self) -> List[str]:
        """사용된 모든 위치를 가져옵니다."""
        locations = set()
        for memo in self.memos:
            if memo["location"]:
                locations.add(memo["location"])
        return sorted(list(locations))

