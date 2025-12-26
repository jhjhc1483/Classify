from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
import pdfplumber
import os
import json
import re
import ast
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

llm = OllamaLLM(model="llama3.1") 
FEEDBACK_FILE = "feedback.json"
HISTORY_FILE = "history.json"
DEPARTMENTS_FILE = "departments.txt"

# --- 유틸리티 함수들 ---
def load_text_file(path):
    if not os.path.exists(path): return ""
    with open(path, "r", encoding="utf-8") as f: return f.read()

def load_pdf_text(pdf_path):
    if not os.path.exists(pdf_path): return ""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted: text += extracted + "\n"
        return text
    except: return ""

def load_json_file(filepath):
    if not os.path.exists(filepath): return []
    try:
        with open(filepath, "r", encoding="utf-8") as f: return json.load(f)
    except: return []

def save_json_file(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_feedback_text():
    data = load_json_file(FEEDBACK_FILE)
    text = ""
    for item in data:
        text += f"- 입력내용: '{item['input']}' -> 정답부서: '{item['department']}'\n"
    return text if text else "없음"

def save_history(user_input, result_json):
    history = load_json_file(HISTORY_FILE)
    history_id = str(uuid.uuid4())
    
    initial_dept = "미정"
    if result_json.get("predictions") and len(result_json["predictions"]) > 0:
        initial_dept = result_json["predictions"][0]["department"]

    new_entry = {
        "id": history_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "input": user_input,
        "summary": result_json.get("summary", ""),
        "keywords": result_json.get("keywords", []),
        "final_department": initial_dept 
    }
    
    history.insert(0, new_entry)
    save_json_file(HISTORY_FILE, history)
    return history_id

# --- 프롬프트 및 체인 ---
prompt_template = ChatPromptTemplate.from_template("""
### 지시사항:
너는 육군에 대해 모든 것을 알고 있는 전문가야. [참고 자료]를 바탕으로 [국회요구자료]를 분석해서 반드시 JSON 형식으로만 응답하라.

[참고 자료]
{dept_list}
{context}
{feedback}

[국회요구자료]
{question}

### 작성 기준:
1. **요약**: 번호를 매기지 말고, 전체 내용을 포괄하는 **자연스러운 줄글(Paragraph) 형태**로 요약할 것. (지휘관 보고용 격식체 사용)
2. **키워드**: 핵심 단어 3개
3. **부서 분류**: 가장 적합한 부서 3개 선정

### 출력 형식 (JSON Only):
{{
    "summary": "00의원실 요구자료로서, 최근 5년간 00부대의 드론 운용 실태 및 예산 집행 내역 전반에 대한 현황 제출을 요구하고 있음.",
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "predictions": [
        {{"rank": 1, "department": "부서명", "reason": "이유"}},
        {{"rank": 2, "department": "부서명", "reason": "이유"}},
        {{"rank": 3, "department": "부서명", "reason": "이유"}}
    ]
}}
""")
chain = prompt_template | llm

# --- API 라우트 ---

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    user_input = data.get('content', '')
    feedback_text = load_feedback_text()

    print(f"📩 분석 시작...")
    try:
        response_text = chain.invoke({
            "dept_list": DEPARTMENTS_LIST,
            "context": REGULATION_TEXT,
            "feedback": feedback_text,
            "question": user_input
        })

        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx+1]
            try:
                result_json = json.loads(json_str)
            except:
                result_json = ast.literal_eval(json_str)
        else:
            result_json = {
                "summary": response_text[:200],
                "keywords": ["분석오류"],
                "predictions": [{"rank": 1, "department": "확인필요", "reason": "포맷오류"}]
            }

        saved_id = save_history(user_input, result_json)
        result_json["history_id"] = saved_id 
        return jsonify(result_json)

    except Exception as e:
        print(f"❌ 에러: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/correct', methods=['POST'])
def correct():
    data = request.json
    history_id = data.get('id')
    content = data.get('content')
    department = data.get('department')
    
    if not department: return jsonify({"error": "부서명 없음"}), 400

    history_data = load_json_file(FEEDBACK_FILE)
    for item in history_data:
        if item['input'] == content:
            item['department'] = department
            break
    else:
        history_data.append({"input": content, "department": department})
    save_json_file(FEEDBACK_FILE, history_data)
    
    if history_id:
        history_list = load_json_file(HISTORY_FILE)
        updated = False
        for item in history_list:
            if item.get('id') == history_id:
                item['final_department'] = department
                updated = True
                break
        if updated: save_json_file(HISTORY_FILE, history_list)

    return jsonify({"message": "수정 완료"})

@app.route('/update_history', methods=['POST'])
def update_history():
    data = request.json
    history_id = data.get('id')
    new_keywords = data.get('keywords') # 리스트 전체를 받아서 교체
    
    if not history_id: return jsonify({"error": "ID 없음"}), 400
        
    history = load_json_file(HISTORY_FILE)
    for item in history:
        if item.get('id') == history_id:
            item['keywords'] = new_keywords
            break
    save_json_file(HISTORY_FILE, history)
    return jsonify({"message": "키워드 수정 완료"})

# ★ 이력 개별 삭제 API (추가됨)
@app.route('/delete_history_item', methods=['POST'])
def delete_history_item():
    data = request.json
    target_id = data.get('id')
    
    if not target_id: return jsonify({"error": "ID 없음"}), 400

    history = load_json_file(HISTORY_FILE)
    # 해당 ID가 아닌 것만 남김 (삭제 효과)
    new_history = [item for item in history if item.get('id') != target_id]
    
    save_json_file(HISTORY_FILE, new_history)
    return jsonify({"message": "삭제 완료"})

@app.route('/clear_history', methods=['POST'])
def clear_history():
    save_json_file(HISTORY_FILE, [])
    return jsonify({"message": "초기화 완료"})

@app.route('/history', methods=['GET'])
def get_history():
    data = load_json_file(HISTORY_FILE)
    return jsonify(data)

REGULATION_TEXT = load_pdf_text("regulation.pdf")
DEPARTMENTS_LIST = load_text_file(DEPARTMENTS_FILE)

if __name__ == '__main__':
    app.run(port=5000, debug=True)