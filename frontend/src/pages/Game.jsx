import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCanvas from '../components/GameCanvas';

export default function Game() {
  const [levelCleared, setLevelCleared] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [emotion, setEmotion] = useState('평온함');
  const [notes, setNotes] = useState('');
  
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  if (!userId) {
    navigate('/');
    return null;
  }

  const handleLevelClear = () => {
    // 잠시 후 감정 일지 모달 띄우기
    setTimeout(() => {
      setLevelCleared(true);
    }, 1500);
  };

  const submitJournal = async () => {
    try {
      await fetch('http://localhost:4000/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, stage: currentLevel, emotion, notes })
      });
      
      setLevelCleared(false);
      setNotes('');
      setCurrentLevel(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("일지 저장에 실패했습니다.");
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#05070e] overflow-hidden">
      <GameCanvas 
        levelIndex={currentLevel} 
        onClear={handleLevelClear} 
        onGameEnd={() => navigate('/ending')}
      />

      {/* 홈 화면으로 돌아가기 버튼 */}
      <button
        onClick={() => {
          if (confirm("정말 메인 화면으로 돌아가시겠습니까? 진행 상황은 저장되지 않습니다.")) {
            navigate('/');
          }
        }}
        className="absolute top-8 right-8 z-40 text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/40 px-6 py-2 rounded-full text-xs tracking-widest bg-black/20 backdrop-blur-md"
      >
        HOME
      </button>

      {/* 감정 일지 모달 오버레이 */}
      {levelCleared && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#05070e]/80 backdrop-blur-lg transition-opacity duration-1000">
          <div className="bg-white/5 border border-white/10 p-10 rounded-3xl flex flex-col items-center max-w-md w-full text-center shadow-2xl">
            <h2 className="text-3xl font-light tracking-widest mb-2">{currentLevel === 0 ? "Tutorial Cleared" : `Stage ${currentLevel} Cleared`}</h2>
            <p className="text-white/50 mb-8 font-light tracking-wider">지금 이 순간, 어떤 감정이 드시나요?</p>
            
            <div className="w-full flex gap-3 justify-center mb-8 flex-wrap">
              {['평온함', '안도감', '답답함', '성취감', '두려움'].map(emo => (
                <button
                  key={emo}
                  onClick={() => setEmotion(emo)}
                  className={`px-5 py-2 rounded-full text-sm transition-all duration-300 ${
                    emotion === emo 
                      ? 'bg-white/20 border border-white/60 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                      : 'border border-white/10 text-white/40 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>

            <textarea 
              className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white/80 focus:outline-none focus:border-white/30 resize-none h-32 mb-8 font-light placeholder:text-white/20"
              placeholder="느낀 점을 자유롭게 기록해 보세요..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            ></textarea>

            <button 
              onClick={submitJournal}
              className="w-full py-4 rounded-full border border-white/20 hover:border-white/80 hover:bg-white/5 transition-all duration-500 tracking-[0.2em] font-light"
            >
              기록하고 계속하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
