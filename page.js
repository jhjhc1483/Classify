"use client";
import { useState, useEffect } from "react";

export default function Home() {
  // --- 상태 관리 ---
  const [view, setView] = useState("MAIN"); // 화면 상태: 'MAIN' 또는 'HISTORY'
  
  // 메인 화면용 상태
  const [content, setContent] = useState("");
  const [data, setData] = useState(null);
  const [editableKeywords, setEditableKeywords] = useState([]);
  const [newKeywordInput, setNewKeywordInput] = useState(""); // 키워드 추가 입력창용
  const [historyId, setHistoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualDept, setManualDept] = useState("");

  // 이력 화면용 상태
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- 메인 기능 함수들 ---

  const handleAnalyze = async () => {
    if (!content) return alert("내용을 입력해주세요.");
    setLoading(true);
    setData(null);
    setHistoryId(null);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const result = await response.json();
      
      if (result.error) {
        alert("분석 실패: " + result.error);
      } else {
        setData(result);
        setEditableKeywords(result.keywords);
        setHistoryId(result.history_id);
      }
    } catch (error) {
      alert("서버 연결 오류!");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeywords = async () => {
    if (!historyId) return;
    try {
      await fetch("http://localhost:5000/update_history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: historyId, keywords: editableKeywords }),
      });
      alert("키워드 수정사항이 이력에 저장되었습니다.");
    } catch (e) { alert("저장 실패"); }
  };

  const handleTrain = async (targetDept) => {
    if (!confirm(`'${targetDept}'(을)를 정답 부서로 확정하시겠습니까?`)) return;
    try {
      await fetch("http://localhost:5000/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: historyId,      
          content: content, 
          department: targetDept 
        }),
      });
      alert(`학습 완료! 이력의 최종 부서가 '${targetDept}'(으)로 변경되었습니다.`);
    } catch (error) { alert("저장 실패"); }
  };

  // ★ 키워드 삭제 기능
  const removeKeyword = (index) => {
    const nextKeywords = editableKeywords.filter((_, i) => i !== index);
    setEditableKeywords(nextKeywords);
  };

  // ★ 키워드 추가 기능
  const addKeyword = () => {
    if (!newKeywordInput.trim()) return;
    setEditableKeywords([...editableKeywords, newKeywordInput.trim()]);
    setNewKeywordInput(""); // 입력창 초기화
  };

  // --- 이력 기능 함수들 ---

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("http://localhost:5000/history");
      const data = await res.json();
      setHistoryList(data);
    } catch (e) { alert("이력 로딩 실패"); }
    finally { setHistoryLoading(false); }
  };

  const handleClearAllHistory = async () => {
    if (!confirm("모든 이력을 삭제하시겠습니까? 복구 불가!")) return;
    await fetch("http://localhost:5000/clear_history", { method: "POST" });
    setHistoryList([]);
    alert("초기화되었습니다.");
  };

  // ★ 개별 이력 삭제
  const handleDeleteItem = async (targetId) => {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    try {
      await fetch("http://localhost:5000/delete_history_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId })
      });
      // 화면에서도 즉시 제거
      setHistoryList(historyList.filter(item => item.id !== targetId));
    } catch (e) { alert("삭제 실패"); }
  };

  // 화면 전환 시 이력 불러오기
  useEffect(() => {
    if (view === "HISTORY") {
      fetchHistory();
    }
  }, [view]);

  // --- 화면 렌더링 ---

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden min-h-[80vh]">
        
        {/* 공통 헤더 */}
        <div className="bg-slate-800 p-6 text-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold">🇰🇷 국회요구자료 AI 분류기</h1>
            <p className="text-slate-300 text-sm mt-1">
              {view === "MAIN" ? "AI 분석 및 부서 분류" : "분석 이력 관리"}
            </p>
          </div>
          
          {/* 뷰 전환 버튼 */}
          {view === "MAIN" ? (
            <button 
              onClick={() => setView("HISTORY")}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-bold border border-slate-600 transition flex items-center gap-2"
            >
              📜 이력 조회
            </button>
          ) : (
            <button 
              onClick={() => setView("MAIN")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold border border-blue-500 transition flex items-center gap-2"
            >
              ← 메인화면 복귀
            </button>
          )}
        </div>

        {/* 1. 메인 화면 (분석) */}
        {view === "MAIN" && (
          <div className="p-6 animate-fade-in">
            <label className="block text-slate-700 font-bold mb-2">요구자료 원문</label>
            <textarea
              className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-black bg-slate-50"
              placeholder="요구내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`w-full mt-4 py-3 rounded-lg font-bold text-white transition shadow-md ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "분석 중..." : "분석 시작"}
            </button>

            {data && (
              <div className="mt-8 space-y-6">
                
                {/* 요약 및 키워드 */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                  <h2 className="text-blue-800 font-bold mb-3">📄 핵심 요약</h2>
                  <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                    {data.summary}
                  </div>
                  
                  {/* 키워드 관리 영역 */}
                  <div className="mt-6 pt-4 border-t border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-slate-500 font-bold">키워드 편집 (추가/삭제 후 저장)</p>
                      <button onClick={handleSaveKeywords} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-bold">
                        변경내용 저장 💾
                      </button>
                    </div>
                    
                    {/* 키워드 리스트 */}
                    <div className="flex gap-2 flex-wrap items-center">
                      {editableKeywords.map((kw, idx) => (
                        <div key={idx} className="flex items-center bg-white border border-blue-200 rounded-full px-3 py-1 shadow-sm">
                          <span className="text-blue-600 text-sm font-bold mr-2">#{kw}</span>
                          <button 
                            onClick={() => removeKeyword(idx)}
                            className="text-slate-400 hover:text-red-500 font-bold text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      {/* 키워드 추가 입력 */}
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={newKeywordInput}
                          onChange={(e) => setNewKeywordInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                          placeholder="새 키워드"
                          className="w-24 px-2 py-1 text-sm border rounded-full focus:outline-none focus:border-blue-400 text-black bg-white"
                        />
                        <button onClick={addKeyword} className="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 부서 추천 */}
                <div>
                  <h2 className="text-slate-800 font-bold mb-4">🏢 담당 부서 추천</h2>
                  <div className="grid gap-4">
                    {data.predictions.map((item, index) => (
                      <div key={index} className={`p-4 rounded-lg border flex items-center justify-between ${index === 0 ? "bg-green-50 border-green-200 ring-1 ring-green-400" : "bg-white"}`}>
                        <div>
                          <span className={`inline-block w-6 h-6 text-center rounded-full mr-2 font-bold ${index===0?"bg-green-500 text-white":"bg-slate-200 text-slate-500"}`}>{item.rank}</span>
                          <span className="font-bold text-slate-800">{item.department}</span>
                          <p className="text-xs text-slate-500 mt-1 ml-8">{item.reason}</p>
                        </div>
                        <button onClick={() => handleTrain(item.department)} className="text-xs bg-white border px-3 py-1 rounded hover:bg-slate-100 text-slate-700">이게 정답 ✅</button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200 flex gap-2">
                    <input type="text" placeholder="직접 부서 입력" value={manualDept} onChange={(e)=>setManualDept(e.target.value)} className="flex-grow p-2 border rounded text-black"/>
                    <button onClick={()=>{if(manualDept) handleTrain(manualDept)}} className="bg-slate-700 text-white px-4 rounded text-sm">학습</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. 이력 화면 (조회/삭제) */}
        {view === "HISTORY" && (
          <div className="p-6 bg-slate-50 min-h-[600px] animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 text-sm">총 {historyList.length}건의 기록이 있습니다.</span>
                <button 
                  onClick={handleClearAllHistory}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-bold border border-red-200"
                >
                  전체 초기화 🗑️
                </button>
             </div>

            {historyLoading ? (
              <p className="text-center text-slate-500 py-10">데이터 로딩 중...</p>
            ) : historyList.length === 0 ? (
              <div className="text-center p-10 bg-white rounded-lg shadow text-slate-500 border border-slate-200">
                기록된 이력이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {historyList.map((item, index) => (
                  <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition relative group">
                    
                    {/* 개별 삭제 버튼 (마우스 올리면 보임 or 항상 보임) */}
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 font-bold transition"
                      title="이 기록 삭제"
                    >
                      ✕
                    </button>

                    <div className="flex items-center mb-3 gap-2">
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        {item.timestamp}
                      </span>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {item.final_department}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-slate-800 text-sm font-medium line-clamp-1">{item.input}</p>
                    </div>

                    {item.keywords && item.keywords.length > 0 && (
                      <div className="mb-3 flex gap-1 flex-wrap">
                        {item.keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded border border-slate-100">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 whitespace-pre-wrap">
                      {item.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}