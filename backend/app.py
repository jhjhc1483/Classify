from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
import pdfplumber
import os

app = Flask(__name__)
# CORS 설정을 더 강력하게 엽니다 (모든 곳에서 접속 허용)
CORS(app, resources={r"/*": {"origins": "*"}})

# 1. AI 모델 설정
try:
    llm = OllamaLLM(model="llama3.1") # gemma2 라면 여기를 gemma2로 수정
    print("✅ AI 모델 설정 완료")
except Exception as e:
    print(f"❌ AI 모델 설정 실패: {e}")

# 2. PDF 읽기 함수 (안전장치 추가)
def load_pdf_text(pdf_path):
    # 파일이 실제로 존재하는지 확인
    if not os.path.exists(pdf_path):
        print(f"❌ 오류: '{pdf_path}' 파일을 찾을 수 없습니다!")
        print("backend 폴더 안에 파일이 있는지, 이름이 정확한지 확인해주세요.")
        return None

    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        print("✅ PDF 로딩 완료!")
        return text
    except Exception as e:
        print(f"❌ PDF 읽기 에러: {e}")
        return None

# 서버 시작 시 PDF 로딩
REGULATION_TEXT = load_pdf_text("regulation.pdf")

# 3. 프롬프트 템플릿
prompt_template = ChatPromptTemplate.from_template("""
당신은 군 행정 업무를 돕는 유능한 참모입니다. 
아래 제공된 [부서별 업무 규정]을 근거로 하여, 들어온 [국회요구자료]를 분석하세요.

---
[부서별 업무 규정]
{context}
---

[국회요구자료 내용]
{question}

---
위 내용을 바탕으로 다음 두 가지를 수행하세요:
1. **요약**: 요구자료의 핵심 내용을 3줄 이내로 간략하게 요약하세요.
2. **담당 부서**: 규정에 근거하여 이 업무를 처리해야 할 '주무 부서'를 하나만 선정하고, 그 이유를 짧게 쓰세요.

답변 형식:
**요약:** (요약 내용)

**담당 부서:** (부서명) - (선정 근거)
""")

chain = prompt_template | llm

@app.route('/analyze', methods=['POST'])
def analyze():
    # 1. PDF가 제대로 로드되었는지 확인
    if not REGULATION_TEXT:
        return jsonify({"error": "서버 오류: 규정 PDF 파일을 읽지 못했습니다. 서버 로그를 확인하세요."}), 500

    try:
        data = request.json
        user_input = data.get('content', '')
        
        if not user_input:
            return jsonify({"error": "내용이 없습니다."}), 400

        print(f"📩 분석 요청 수신: {user_input[:20]}...")
        
        # 2. AI 실행 (에러 발생 시 잡아냄)
        response = chain.invoke({
            "context": REGULATION_TEXT,
            "question": user_input
        })
        
        print("✅ 분석 완료!")
        return jsonify({"result": response})

    except Exception as e:
        # 여기가 핵심입니다. 에러가 나면 터미널에 출력해줍니다.
        print(f"❌ 처리 중 치명적 오류 발생: {str(e)}")
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)