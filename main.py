"""
공인중개사용 메모 애플리케이션
PySide6를 사용한 현대적인 메모 관리 시스템
"""
import sys
import os
from typing import Optional, Dict, Any
from datetime import datetime

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QGridLayout, QLabel, QPushButton, QLineEdit, QTextEdit, 
    QListWidget, QListWidgetItem, QFrame, QGroupBox, QComboBox,
    QMessageBox, QSplitter, QScrollArea, QSizePolicy
)
from PySide6.QtCore import Qt, QTimer, Signal, QThread
from PySide6.QtGui import QFont, QIcon, QPixmap, QPalette, QColor

from memo_model import MemoModel


class MemoItemWidget(QWidget):
    """메모 리스트 아이템을 위한 커스텀 위젯"""
    
    memo_selected = Signal(dict)
    
    def __init__(self, memo_data: Dict[str, Any], parent=None):
        super().__init__(parent)
        self.memo_data = memo_data
        self.setup_ui()
        self.setup_style()
    
    def setup_ui(self):
        """UI 구성"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 8, 10, 8)
        layout.setSpacing(5)
        
        # 제목 - 이지지색상
        self.title_label = QLabel(self.memo_data.get("title", "제목 없음"))
        self.title_label.setFont(QFont("Inter", 14, QFont.Bold))
        self.title_label.setWordWrap(True)
        self.title_label.setStyleSheet("color: var(--easy-text-dark); font-weight: 700; margin-bottom: 4px;")
        
        # 내용 미리보기 - 이지지색상
        content = self.memo_data.get("content", "")
        preview = content[:100] + "..." if len(content) > 100 else content
        self.content_label = QLabel(preview)
        self.content_label.setFont(QFont("Inter", 11))
        self.content_label.setWordWrap(True)
        self.content_label.setStyleSheet("color: var(--easy-text-medium); line-height: 1.5; margin-bottom: 8px;")
        
        # 메타 정보
        meta_layout = QHBoxLayout()
        
        # 카테고리 - 이지지색상 (연보라)
        if self.memo_data.get("category"):
            self.category_label = QLabel(f"📁 {self.memo_data['category']}")
            self.category_label.setFont(QFont("Inter", 10, QFont.Bold))
            self.category_label.setStyleSheet("color: var(--easy-purple); background: #e8eaf6; padding: 6px 12px; border-radius: 20px; font-weight: 600; border: 1px solid var(--easy-purple);")
            meta_layout.addWidget(self.category_label)
        
        # 부동산 유형 - 이지지색상 (민트 그린)
        if self.memo_data.get("property_type"):
            self.property_label = QLabel(f"🏠 {self.memo_data['property_type']}")
            self.property_label.setFont(QFont("Inter", 10, QFont.Bold))
            self.property_label.setStyleSheet("color: var(--easy-green); background: #e0f2f1; padding: 6px 12px; border-radius: 20px; font-weight: 600; border: 1px solid var(--easy-green);")
            meta_layout.addWidget(self.property_label)
        
        # 우선순위 - 이지지색상 (상태 색상 사용)
        priority = self.memo_data.get("priority", "보통")
        priority_styles = {
            "높음": "color: var(--easy-danger); background: #ffebee; border: 1px solid var(--easy-danger);",
            "보통": "color: var(--easy-warning); background: #fff3e0; border: 1px solid var(--easy-warning);",
            "낮음": "color: var(--easy-purple); background: #e8eaf6; border: 1px solid var(--easy-purple);"
        }
        self.priority_label = QLabel(f"⚡ {priority}")
        self.priority_label.setFont(QFont("Inter", 10, QFont.Bold))
        self.priority_label.setStyleSheet(f"{priority_styles.get(priority, priority_styles['보통'])} padding: 6px 12px; border-radius: 20px; font-weight: 600;")
        meta_layout.addWidget(self.priority_label)
        
        meta_layout.addStretch()
        
        # 날짜
        created_at = self.memo_data.get("created_at", "")
        if created_at:
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                date_str = dt.strftime("%Y-%m-%d %H:%M")
            except:
                date_str = created_at
        else:
            date_str = "날짜 없음"
            
        self.date_label = QLabel(date_str)
        self.date_label.setFont(QFont("Inter", 9))
        self.date_label.setStyleSheet("color: var(--easy-text-light); font-weight: 400;")
        meta_layout.addWidget(self.date_label)
        
        layout.addWidget(self.title_label)
        layout.addWidget(self.content_label)
        layout.addLayout(meta_layout)
        
        # 클릭 이벤트 설정
        self.setCursor(Qt.PointingHandCursor)
    
    def setup_style(self):
        """스타일 설정 - 이지지색상"""
        self.setStyleSheet("""
            MemoItemWidget {
                background-color: var(--easy-light-bg);
                border: 2px solid var(--easy-border);
                border-radius: 16px;
                margin: 6px;
                transition: all 0.3s ease-in-out;
                box-shadow: 0 2px 4px -1px var(--easy-shadow);
            }
            MemoItemWidget:hover {
                background-color: var(--easy-medium-bg);
                border-color: var(--easy-purple);
                box-shadow: 0 10px 15px -3px rgba(179, 157, 219, 0.3), 0 4px 6px -2px rgba(179, 157, 219, 0.2);
                transform: translateY(-3px) scale(1.02);
            }
        """)
    
    def mousePressEvent(self, event):
        """마우스 클릭 이벤트"""
        if event.button() == Qt.LeftButton:
            self.memo_selected.emit(self.memo_data)
        super().mousePressEvent(event)


class MemoApp(QMainWindow):
    """메인 메모 애플리케이션 클래스"""
    
    def __init__(self):
        super().__init__()
        self.memo_model = MemoModel()
        self.current_memo_id = None
        self.is_editing = False
        
        self.setup_ui()
        self.setup_style()
        self.load_memos()
        self.setup_connections()
    
    def setup_ui(self):
        """UI 구성"""
        self.setWindowTitle("공인중개사 메모 관리 시스템")
        self.setGeometry(100, 100, 1200, 800)
        self.setMinimumSize(800, 600)
        
        # 중앙 위젯
        central_widget = QWidget()
        central_widget.setObjectName("mainWidget")
        self.setCentralWidget(central_widget)
        
        # 메인 레이아웃
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)
        
        # 헤더
        self.create_header(main_layout)
        
        # 컨트롤 패널
        self.create_control_panel(main_layout)
        
        # 메인 콘텐츠 영역 (스플리터)
        self.create_main_content(main_layout)
        
        # 상태바
        self.create_status_bar()
    
    def create_header(self, parent_layout):
        """헤더 생성"""
        header_frame = QFrame()
        header_frame.setObjectName("headerFrame")
        header_frame.setFixedHeight(60)
        
        header_layout = QHBoxLayout(header_frame)
        header_layout.setContentsMargins(20, 10, 20, 10)
        
        # 제목 - 이지지색상
        title_label = QLabel("🏠 공인중개사 메모 관리 시스템")
        title_label.setObjectName("titleLabel")
        title_label.setFont(QFont("Inter", 20, QFont.Bold))
        title_label.setStyleSheet("color: var(--easy-light-bg);")  # 헤더 배경색과 대비되도록
        
        header_layout.addWidget(title_label)
        header_layout.addStretch()
        
        # 사용자 정보 (선택사항)
        user_label = QLabel("관리자")
        user_label.setStyleSheet("color: white; font-size: 14px;")
        header_layout.addWidget(user_label)
        
        parent_layout.addWidget(header_frame)
    
    def create_control_panel(self, parent_layout):
        """컨트롤 패널 생성"""
        control_frame = QFrame()
        control_frame.setObjectName("controlFrame")
        control_frame.setFixedHeight(80)
        
        control_layout = QVBoxLayout(control_frame)
        control_layout.setContentsMargins(15, 10, 15, 10)
        control_layout.setSpacing(10)
        
        # 상단 버튼들
        button_layout = QHBoxLayout()
        
        # 새 메모 버튼
        self.new_memo_btn = QPushButton("📝 새 메모")
        self.new_memo_btn.setObjectName("newMemoButton")
        self.new_memo_btn.setFixedHeight(35)
        
        # 수정 버튼
        self.edit_btn = QPushButton("✏️ 수정")
        self.edit_btn.setObjectName("editButton")
        self.edit_btn.setFixedHeight(35)
        self.edit_btn.setEnabled(False)
        
        # 저장 버튼
        self.save_btn = QPushButton("💾 저장")
        self.save_btn.setObjectName("saveButton")
        self.save_btn.setFixedHeight(35)
        self.save_btn.setVisible(False)
        
        # 취소 버튼
        self.cancel_btn = QPushButton("❌ 취소")
        self.cancel_btn.setObjectName("cancelButton")
        self.cancel_btn.setFixedHeight(35)
        self.cancel_btn.setVisible(False)
        
        # 삭제 버튼
        self.delete_btn = QPushButton("🗑️ 삭제")
        self.delete_btn.setObjectName("deleteButton")
        self.delete_btn.setFixedHeight(35)
        self.delete_btn.setEnabled(False)
        
        button_layout.addWidget(self.new_memo_btn)
        button_layout.addWidget(self.edit_btn)
        button_layout.addWidget(self.save_btn)
        button_layout.addWidget(self.cancel_btn)
        button_layout.addWidget(self.delete_btn)
        button_layout.addStretch()
        
        # 하단 검색 및 필터
        search_layout = QHBoxLayout()
        
        # 검색 입력 - 이지지색상
        search_label = QLabel("🔍 검색:")
        search_label.setFont(QFont("Inter", 11, QFont.Medium))
        search_label.setStyleSheet("color: var(--easy-text-dark); font-weight: 500;")
        
        self.search_input = QLineEdit()
        self.search_input.setObjectName("searchInput")
        self.search_input.setPlaceholderText("제목, 내용, 카테고리, 위치로 검색...")
        self.search_input.setFixedHeight(36)
        
        # 카테고리 필터 - 이지지색상
        category_label = QLabel("카테고리:")
        category_label.setFont(QFont("Inter", 11))
        category_label.setStyleSheet("color: var(--easy-text-dark);")
        
        self.category_combo = QComboBox()
        self.category_combo.setObjectName("categoryCombo")
        self.category_combo.addItem("전체")
        self.category_combo.setFixedHeight(36)
        
        # 부동산 유형 필터 - 이지지색상
        property_label = QLabel("부동산 유형:")
        property_label.setFont(QFont("Inter", 11))
        property_label.setStyleSheet("color: var(--easy-text-dark);")
        
        self.property_combo = QComboBox()
        self.property_combo.setObjectName("propertyCombo")
        self.property_combo.addItem("전체")
        self.property_combo.setFixedHeight(36)
        
        # 우선순위 필터 - 이지지색상
        priority_label = QLabel("우선순위:")
        priority_label.setFont(QFont("Inter", 11))
        priority_label.setStyleSheet("color: var(--easy-text-dark);")
        
        self.priority_combo = QComboBox()
        self.priority_combo.setObjectName("priorityCombo")
        self.priority_combo.addItems(["전체", "높음", "보통", "낮음"])
        self.priority_combo.setFixedHeight(36)
        
        search_layout.addWidget(search_label)
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(category_label)
        search_layout.addWidget(self.category_combo)
        search_layout.addWidget(property_label)
        search_layout.addWidget(self.property_combo)
        search_layout.addWidget(priority_label)
        search_layout.addWidget(self.priority_combo)
        
        control_layout.addLayout(button_layout)
        control_layout.addLayout(search_layout)
        
        parent_layout.addWidget(control_frame)
    
    def create_main_content(self, parent_layout):
        """메인 콘텐츠 영역 생성"""
        # 스플리터 생성
        splitter = QSplitter(Qt.Horizontal)
        splitter.setChildrenCollapsible(False)
        
        # 왼쪽: 메모 리스트
        self.create_memo_list(splitter)
        
        # 오른쪽: 메모 상세 보기/편집
        self.create_memo_detail(splitter)
        
        # 스플리터 비율 설정
        splitter.setSizes([400, 600])
        
        parent_layout.addWidget(splitter)
    
    def create_memo_list(self, parent):
        """메모 리스트 생성"""
        list_frame = QFrame()
        list_frame.setObjectName("memoListFrame")
        
        list_layout = QVBoxLayout(list_frame)
        list_layout.setContentsMargins(5, 5, 5, 5)
        
        # 리스트 제목 - 이지지색상
        list_title = QLabel("📋 메모 목록")
        list_title.setFont(QFont("Inter", 14, QFont.Bold))
        list_title.setStyleSheet("color: var(--easy-text-dark); font-weight: 700; margin-bottom: 12px;")
        list_layout.addWidget(list_title)
        
        # 메모 리스트
        self.memo_list = QListWidget()
        self.memo_list.setObjectName("memoList")
        self.memo_list.setAlternatingRowColors(True)
        
        list_layout.addWidget(self.memo_list)
        
        parent.addWidget(list_frame)
    
    def create_memo_detail(self, parent):
        """메모 상세 보기/편집 영역 생성"""
        detail_frame = QFrame()
        detail_frame.setObjectName("memoDetailFrame")
        
        detail_layout = QVBoxLayout(detail_frame)
        detail_layout.setContentsMargins(15, 15, 15, 15)
        detail_layout.setSpacing(15)
        
        # 제목 영역
        title_group = QGroupBox("메모 정보")
        title_layout = QVBoxLayout(title_group)
        
        # 제목 입력 - 이지지색상
        title_label = QLabel("제목:")
        title_label.setFont(QFont("Inter", 12, QFont.Medium))
        title_label.setStyleSheet("color: var(--easy-text-dark); font-weight: 500; margin-bottom: 8px;")
        
        self.title_input = QLineEdit()
        self.title_input.setObjectName("titleInput")
        self.title_input.setPlaceholderText("메모 제목을 입력하세요...")
        self.title_input.setReadOnly(True)
        
        title_layout.addWidget(title_label)
        title_layout.addWidget(self.title_input)
        
        # 메타 정보 그리드
        meta_layout = QGridLayout()
        
        # 카테고리 - 이지지색상
        category_label = QLabel("카테고리:")
        category_label.setFont(QFont("Inter", 11))
        category_label.setStyleSheet("color: var(--easy-text-dark);")
        
        self.category_input = QComboBox()
        self.category_input.setObjectName("categoryInput")
        self.category_input.setEditable(True)
        self.category_input.setPlaceholderText("카테고리 선택...")
        self.category_input.setEnabled(False)
        
        # 부동산 유형 - 이지지색상
        property_label = QLabel("부동산 유형:")
        property_label.setFont(QFont("Inter", 11))
        property_label.setStyleSheet("color: var(--easy-text-dark);")
        
        self.property_input = QComboBox()
        self.property_input.setObjectName("propertyInput")
        self.property_input.setEditable(True)
        self.property_input.setPlaceholderText("부동산 유형 선택...")
        self.property_input.addItems([
            "아파트", "빌라", "단독주택", "오피스텔", "상가", 
            "사무실", "공장", "창고", "토지", "기타"
        ])
        self.property_input.setEnabled(False)
        
        # 위치 - 이지지색상
        location_label = QLabel("위치:")
        location_label.setFont(QFont("Inter", 11))
        location_label.setStyleSheet("color: var(--easy-text-dark);")
        
        self.location_input = QLineEdit()
        self.location_input.setObjectName("locationInput")
        self.location_input.setPlaceholderText("위치를 입력하세요...")
        self.location_input.setReadOnly(True)
        
        # 우선순위 - 이지지색상
        priority_label = QLabel("우선순위:")
        priority_label.setFont(QFont("Inter", 11))
        priority_label.setStyleSheet("color: var(--easy-text-dark);")
        
        self.priority_input = QComboBox()
        self.priority_input.setObjectName("priorityInput")
        self.priority_input.addItems(["높음", "보통", "낮음"])
        self.priority_input.setEnabled(False)
        
        meta_layout.addWidget(category_label, 0, 0)
        meta_layout.addWidget(self.category_input, 0, 1)
        meta_layout.addWidget(property_label, 0, 2)
        meta_layout.addWidget(self.property_input, 0, 3)
        meta_layout.addWidget(location_label, 1, 0)
        meta_layout.addWidget(self.location_input, 1, 1)
        meta_layout.addWidget(priority_label, 1, 2)
        meta_layout.addWidget(self.priority_input, 1, 3)
        
        title_layout.addLayout(meta_layout)
        detail_layout.addWidget(title_group)
        
        # 내용 영역
        content_group = QGroupBox("메모 내용")
        content_layout = QVBoxLayout(content_group)
        
        content_label = QLabel("내용:")
        content_label.setFont(QFont("Inter", 12, QFont.Medium))
        content_label.setStyleSheet("color: var(--easy-text-dark); font-weight: 500; margin-bottom: 8px;")
        
        self.content_input = QTextEdit()
        self.content_input.setObjectName("contentInput")
        self.content_input.setPlaceholderText("메모 내용을 입력하세요...")
        self.content_input.setReadOnly(True)
        self.content_input.setMinimumHeight(200)
        
        content_layout.addWidget(content_label)
        content_layout.addWidget(self.content_input)
        
        detail_layout.addWidget(content_group)
        
        # 빈 공간 채우기
        detail_layout.addStretch()
        
        parent.addWidget(detail_frame)
    
    def create_status_bar(self):
        """상태바 생성"""
        self.status_label = QLabel("준비")
        self.status_label.setObjectName("statusLabel")
        self.statusBar().addWidget(self.status_label)
    
    def setup_style(self):
        """스타일 설정"""
        # CSS 파일 로드
        try:
            with open("styles.css", "r", encoding="utf-8") as f:
                self.setStyleSheet(f.read())
        except FileNotFoundError:
            print("CSS 파일을 찾을 수 없습니다. 기본 스타일을 사용합니다.")
    
    def setup_connections(self):
        """이벤트 연결 설정"""
        # 버튼 이벤트
        self.new_memo_btn.clicked.connect(self.create_new_memo)
        self.edit_btn.clicked.connect(self.edit_memo)
        self.save_btn.clicked.connect(self.save_memo)
        self.cancel_btn.clicked.connect(self.cancel_edit)
        self.delete_btn.clicked.connect(self.delete_memo)
        
        # 검색 이벤트
        self.search_input.textChanged.connect(self.search_memos)
        self.category_combo.currentTextChanged.connect(self.filter_memos)
        self.property_combo.currentTextChanged.connect(self.filter_memos)
        self.priority_combo.currentTextChanged.connect(self.filter_memos)
        
        # 리스트 이벤트
        self.memo_list.itemClicked.connect(self.on_memo_selected)
    
    def load_memos(self):
        """메모 목록 로드"""
        self.memo_list.clear()
        memos = self.memo_model.get_all_memos()
        
        for memo in memos:
            item_widget = MemoItemWidget(memo)
            item_widget.memo_selected.connect(self.select_memo)
            
            list_item = QListWidgetItem()
            list_item.setSizeHint(item_widget.sizeHint())
            
            self.memo_list.addItem(list_item)
            self.memo_list.setItemWidget(list_item, item_widget)
        
        # 콤보박스 업데이트
        self.update_combo_boxes()
        
        self.status_label.setText(f"총 {len(memos)}개의 메모")
    
    def update_combo_boxes(self):
        """콤보박스 옵션 업데이트"""
        # 카테고리 콤보박스
        current_category = self.category_combo.currentText()
        self.category_combo.clear()
        self.category_combo.addItem("전체")
        self.category_combo.addItems(self.memo_model.get_categories())
        if current_category in [self.category_combo.itemText(i) for i in range(self.category_combo.count())]:
            self.category_combo.setCurrentText(current_category)
        
        # 부동산 유형 콤보박스
        current_property = self.property_combo.currentText()
        self.property_combo.clear()
        self.property_combo.addItem("전체")
        self.property_combo.addItems(self.memo_model.get_property_types())
        if current_property in [self.property_combo.itemText(i) for i in range(self.property_combo.count())]:
            self.property_combo.setCurrentText(current_property)
    
    def create_new_memo(self):
        """새 메모 생성"""
        self.clear_memo_detail()
        self.set_edit_mode(True)
        self.current_memo_id = None
        self.status_label.setText("새 메모 작성 중...")
    
    def edit_memo(self):
        """메모 편집 모드"""
        if self.current_memo_id:
            self.set_edit_mode(True)
            self.status_label.setText("메모 편집 중...")
    
    def set_edit_mode(self, edit_mode: bool):
        """편집 모드 설정"""
        self.is_editing = edit_mode
        
        # 입력 필드 활성화/비활성화
        self.title_input.setReadOnly(not edit_mode)
        self.content_input.setReadOnly(not edit_mode)
        self.category_input.setEnabled(edit_mode)
        self.property_input.setEnabled(edit_mode)
        self.location_input.setReadOnly(not edit_mode)
        self.priority_input.setEnabled(edit_mode)
        
        # 버튼 표시/숨김
        self.edit_btn.setVisible(not edit_mode)
        self.save_btn.setVisible(edit_mode)
        self.cancel_btn.setVisible(edit_mode)
        self.new_memo_btn.setEnabled(not edit_mode)
        self.delete_btn.setEnabled(not edit_mode)
    
    def save_memo(self):
        """메모 저장"""
        title = self.title_input.text().strip()
        content = self.content_input.toPlainText().strip()
        
        if not title:
            QMessageBox.warning(self, "경고", "제목을 입력해주세요.")
            return
        
        if not content:
            QMessageBox.warning(self, "경고", "내용을 입력해주세요.")
            return
        
        memo_data = {
            "title": title,
            "content": content,
            "category": self.category_input.currentText(),
            "property_type": self.property_input.currentText(),
            "location": self.location_input.text(),
            "priority": self.priority_input.currentText()
        }
        
        if self.current_memo_id:
            # 기존 메모 업데이트
            if self.memo_model.update_memo(self.current_memo_id, **memo_data):
                self.status_label.setText("메모가 저장되었습니다.")
            else:
                QMessageBox.critical(self, "오류", "메모 저장에 실패했습니다.")
                return
        else:
            # 새 메모 생성
            memo = self.memo_model.create_memo(**memo_data)
            self.current_memo_id = memo["id"]
            self.status_label.setText("새 메모가 생성되었습니다.")
        
        self.set_edit_mode(False)
        self.load_memos()
        self.select_memo_by_id(self.current_memo_id)
    
    def cancel_edit(self):
        """편집 취소"""
        if self.current_memo_id:
            # 기존 메모 데이터로 복원
            memo = self.memo_model.get_memo(self.current_memo_id)
            if memo:
                self.display_memo(memo)
        else:
            self.clear_memo_detail()
        
        self.set_edit_mode(False)
        self.status_label.setText("편집이 취소되었습니다.")
    
    def delete_memo(self):
        """메모 삭제"""
        if not self.current_memo_id:
            return
        
        reply = QMessageBox.question(
            self, "메모 삭제", 
            "정말로 이 메모를 삭제하시겠습니까?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            if self.memo_model.delete_memo(self.current_memo_id):
                self.status_label.setText("메모가 삭제되었습니다.")
                self.clear_memo_detail()
                self.load_memos()
            else:
                QMessageBox.critical(self, "오류", "메모 삭제에 실패했습니다.")
    
    def select_memo(self, memo_data: Dict[str, Any]):
        """메모 선택"""
        self.current_memo_id = memo_data["id"]
        self.display_memo(memo_data)
        self.edit_btn.setEnabled(True)
        self.delete_btn.setEnabled(True)
        self.set_edit_mode(False)
    
    def select_memo_by_id(self, memo_id: int):
        """ID로 메모 선택"""
        memo = self.memo_model.get_memo(memo_id)
        if memo:
            self.select_memo(memo)
    
    def on_memo_selected(self, item):
        """리스트 아이템 선택 이벤트"""
        # 이벤트는 MemoItemWidget에서 처리됨
        pass
    
    def display_memo(self, memo_data: Dict[str, Any]):
        """메모 상세 정보 표시"""
        self.title_input.setText(memo_data.get("title", ""))
        self.content_input.setPlainText(memo_data.get("content", ""))
        self.category_input.setCurrentText(memo_data.get("category", ""))
        self.property_input.setCurrentText(memo_data.get("property_type", ""))
        self.location_input.setText(memo_data.get("location", ""))
        self.priority_input.setCurrentText(memo_data.get("priority", "보통"))
    
    def clear_memo_detail(self):
        """메모 상세 정보 초기화"""
        self.title_input.clear()
        self.content_input.clear()
        self.category_input.setCurrentText("")
        self.property_input.setCurrentText("")
        self.location_input.clear()
        self.priority_input.setCurrentText("보통")
        self.current_memo_id = None
        self.edit_btn.setEnabled(False)
        self.delete_btn.setEnabled(False)
    
    def search_memos(self):
        """메모 검색"""
        query = self.search_input.text()
        self.filter_memos()
    
    def filter_memos(self):
        """메모 필터링"""
        query = self.search_input.text()
        category = self.category_combo.currentText()
        property_type = self.property_combo.currentText()
        priority = self.priority_combo.currentText()
        
        # 검색 실행
        if query.strip():
            memos = self.memo_model.search_memos(query)
        else:
            memos = self.memo_model.get_all_memos()
        
        # 필터 적용
        filtered_memos = []
        for memo in memos:
            if category != "전체" and memo.get("category") != category:
                continue
            if property_type != "전체" and memo.get("property_type") != property_type:
                continue
            if priority != "전체" and memo.get("priority") != priority:
                continue
            filtered_memos.append(memo)
        
        # 리스트 업데이트
        self.memo_list.clear()
        for memo in filtered_memos:
            item_widget = MemoItemWidget(memo)
            item_widget.memo_selected.connect(self.select_memo)
            
            list_item = QListWidgetItem()
            list_item.setSizeHint(item_widget.sizeHint())
            
            self.memo_list.addItem(list_item)
            self.memo_list.setItemWidget(list_item, item_widget)
        
        self.status_label.setText(f"검색 결과: {len(filtered_memos)}개")


def main():
    """메인 함수"""
    app = QApplication(sys.argv)
    
    # 애플리케이션 정보 설정
    app.setApplicationName("공인중개사 메모 관리 시스템")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("Real Estate Management")
    
    # 메인 윈도우 생성 및 표시
    window = MemoApp()
    window.show()
    
    # 이벤트 루프 시작
    sys.exit(app.exec())


if __name__ == "__main__":
    main()