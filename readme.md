실행하기
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

npm install -D tailwindcss postcss autoprefixer (tailwindcss 설치)

노드 모듈 재설치 (깔끔한 초기화)
기존 설정을 지우고 다시 설치
frontend 폴더 안에 있는 node_modules 폴더와 package-lock.json 파일을 삭제
터미널에서 frontend 폴더로 이동
npm install을 입력하여 모든 패키지를 다시 설치

npm run dev

성공 시: Ready in ... http://localhost:3000 메시지가 뜹니다.
