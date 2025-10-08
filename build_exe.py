"""
공인중개사 메모 관리 시스템 EXE 빌드 스크립트
PyInstaller를 사용하여 독립 실행 가능한 exe 파일을 생성합니다.
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def build_exe():
    """EXE 파일 빌드 함수"""
    print("공인중개사 메모 관리 시스템 EXE 빌드 시작...")
    
    # 현재 디렉토리 확인
    current_dir = Path.cwd()
    print(f"작업 디렉토리: {current_dir}")
    
    # 필요한 파일들 확인
    required_files = ['main.py', 'memo_model.py', 'styles.css', 'memos.json']
    missing_files = []
    
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"누락된 파일들: {missing_files}")
        return False
    
    print("모든 필요한 파일이 존재합니다.")
    
    # PyInstaller 명령어 구성
    pyinstaller_cmd = [
        'pyinstaller',
        '--onefile',                    # 단일 exe 파일 생성
        '--windowed',                    # 콘솔 창 숨기기 (GUI 앱)
        '--name=공인중개사메모관리시스템',  # exe 파일 이름
        '--icon=icon.ico',               # 아이콘 (있는 경우)
        '--add-data=styles.css;.',      # CSS 파일 포함
        '--add-data=memos.json;.',      # JSON 파일 포함
        '--hidden-import=PySide6.QtCore',
        '--hidden-import=PySide6.QtWidgets', 
        '--hidden-import=PySide6.QtGui',
        '--clean',                       # 이전 빌드 파일 정리
        'main.py'                        # 메인 스크립트
    ]
    
    # 아이콘 파일이 없으면 해당 옵션 제거
    if not Path('icon.ico').exists():
        pyinstaller_cmd = [cmd for cmd in pyinstaller_cmd if not cmd.startswith('--icon')]
        print("아이콘 파일이 없어 기본 아이콘을 사용합니다.")
    
    print("PyInstaller 실행 중...")
    print(f"명령어: {' '.join(pyinstaller_cmd)}")
    
    try:
        # PyInstaller 실행
        result = subprocess.run(pyinstaller_cmd, check=True, capture_output=True, text=True)
        print("PyInstaller 실행 완료!")
        
        # 빌드 결과 확인
        dist_dir = Path('dist')
        exe_file = dist_dir / '공인중개사메모관리시스템.exe'
        
        if exe_file.exists():
            file_size = exe_file.stat().st_size / (1024 * 1024)  # MB 단위
            print("EXE 파일 생성 성공!")
            print(f"위치: {exe_file.absolute()}")
            print(f"크기: {file_size:.1f} MB")
            
            # 배포용 폴더 생성
            deploy_dir = Path('배포용')
            deploy_dir.mkdir(exist_ok=True)
            
            # exe 파일 복사
            deploy_exe = deploy_dir / '공인중개사메모관리시스템.exe'
            shutil.copy2(exe_file, deploy_exe)
            
            # README 파일 생성
            readme_content = """# 공인중개사 메모 관리 시스템

## 실행 방법
1. '공인중개사메모관리시스템.exe' 파일을 더블클릭하여 실행합니다.
2. 별도의 설치 과정이 필요하지 않습니다.

## 주요 기능
- 📝 메모 생성, 수정, 삭제
- 🔍 제목, 내용, 카테고리, 위치로 검색
- 🏷️ 카테고리 및 부동산 유형별 분류
- ⚡ 우선순위 설정
- 💾 자동 저장 기능

## 시스템 요구사항
- Windows 10 이상
- 별도의 소프트웨어 설치 불필요

## 주의사항
- 프로그램을 처음 실행하면 메모 데이터가 저장될 폴더가 자동 생성됩니다.
- 프로그램을 종료하기 전에 저장 버튼을 눌러 데이터를 보존하세요.

## 문의사항
프로그램 사용 중 문제가 발생하면 개발자에게 문의하세요.
"""
            
            readme_file = deploy_dir / 'README.txt'
            with open(readme_file, 'w', encoding='utf-8') as f:
                f.write(readme_content)
            
            print(f"배포용 폴더 생성 완료: {deploy_dir.absolute()}")
            print(f"사용 설명서 생성: {readme_file.absolute()}")
            
            return True
            
        else:
            print("EXE 파일이 생성되지 않았습니다.")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"PyInstaller 실행 실패: {e}")
        print(f"에러 출력: {e.stderr}")
        return False
    except Exception as e:
        print(f"예상치 못한 오류: {e}")
        return False

def cleanup():
    """빌드 과정에서 생성된 임시 파일들 정리"""
    print("임시 파일 정리 중...")
    
    cleanup_dirs = ['build', '__pycache__']
    cleanup_files = ['공인중개사메모관리시스템.spec']
    
    for dir_name in cleanup_dirs:
        if Path(dir_name).exists():
            shutil.rmtree(dir_name)
            print(f"{dir_name} 폴더 삭제")
    
    for file_name in cleanup_files:
        if Path(file_name).exists():
            Path(file_name).unlink()
            print(f"{file_name} 파일 삭제")

if __name__ == "__main__":
    print("=" * 60)
    print("공인중개사 메모 관리 시스템 EXE 빌더")
    print("=" * 60)
    
    success = build_exe()
    
    if success:
        print("\n빌드 완료!")
        print("'배포용' 폴더에서 exe 파일을 확인하세요.")
        
        # 정리 여부 확인
        cleanup_choice = input("\n임시 파일을 정리하시겠습니까? (y/n): ").lower()
        if cleanup_choice in ['y', 'yes', '예']:
            cleanup()
            print("정리 완료!")
    else:
        print("\n빌드 실패!")
        print("오류 메시지를 확인하고 다시 시도해주세요.")
    
    input("\n엔터를 눌러 종료...")
