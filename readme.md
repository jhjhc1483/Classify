0단계: 사전 준비 (Ollama 모델 다운로드)
가장 먼저 AI 모델을 준비해야 합니다. 한국어를 잘하고 성능이 준수한 llama3.1 버전을 추천합니다.

터미널(명령 프롬프트)을 엽니다.

아래 명령어를 입력하여 모델을 다운로드합니다.

Bash

ollama pull llama3.1
(또는 gemma2 모델도 한국어 성능이 좋습니다. ollama pull gemma2로 대체 가능합니다.)


1단계: 프로젝트 폴더 만들기
바탕화면이나 편한 곳에 전체 프로젝트 폴더를 하나 만드세요. 이름은 army-helper로 하겠습니다.

VS Code를 실행합니다.

File -> Open Folder를 눌러 army-helper 폴더를 선택합니다.

VS Code 내에서 터미널을 엽니다 (Ctrl + ~ 키).

2단계: 백엔드 만들기 (Python) - 뇌 만들기
규정(PDF)을 읽고 AI를 돌리는 서버입니다.

1. 백엔드 폴더 및 가상환경 생성
VS Code 터미널에 다음을 한 줄씩 입력하세요.

Bash

mkdir backend
cd backend
python -m venv venv

3. 필요한 라이브러리 설치
PDF를 읽고, 웹 서버를 열고, AI와 통신하기 위한 도구들을 설치합니다.

Bash

pip install flask flask-cors langchain-ollama pdfplumber
4. 규정 PDF 파일 넣기

가지고 계신 "부서별 담당업무 예규.pdf" 파일을 backend 폴더 안에 넣어주세요. (파일 이름을 regulation.pdf로 변경해서 넣어주시면 아래 코드를 수정할 필요가 없습니다.)

5. 서버 코드 작성 (app.py)
backend 폴더 안에 app.py라는 파일을 만들고 아래 코드를 그대로 복사해 붙여넣으세요.

3단계: 프론트엔드 만들기 (Next.js) - 화면 만들기
이제 사용자가 볼 웹사이트를 만듭니다.

1. Next.js 설치
VS Code 터미널에서 backend 폴더에서 빠져나와 루트 폴더(army-helper)로 이동 후 설치합니다.

Bash

cd ..  # army-helper 폴더로 이동
npx create-next-app@latest frontend
설치 중에 질문이 나오면 다 Enter(Yes)를 누르시면 됩니다. (기본 설정 사용)

2. 프론트엔드 코드 작성
frontend/src/app/page.js 파일을 엽니다. (Next.js 13버전 이상 기준, app 폴더 내에 있습니다). 기존 내용을 다 지우고 아래 코드로 덮어씌우세요.

4단계: 실행하기
이제 모든 준비가 끝났습니다! 두 개의 터미널을 열어서 각각 실행해야 합니다.

터미널 1: 백엔드 실행 (Python)

VS Code 터미널을 엽니다.

cd backend 입력

.\venv\Scripts\activate (가상환경 켜기)

python app.py

성공 시: Running on http://127.0.0.1:5000 메시지가 뜹니다.

터미널 2: 프론트엔드 실행 (Next.js)

VS Code에서 터미널을 하나 더 추가합니다 (우측 상단 + 버튼).

cd frontend 입력

npm run dev

성공 시: Ready in ... http://localhost:3000 메시지가 뜹니다.
