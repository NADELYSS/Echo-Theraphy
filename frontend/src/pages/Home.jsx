import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!username.trim()) return alert("이름을 입력해주세요.");
    
    try {
      const res = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      localStorage.setItem('userId', data.id);
      localStorage.setItem('username', data.username);
      navigate('/game');
    } catch (err) {
      console.error(err);
      alert("백엔드 서버(http://localhost:4000)가 켜져 있는지 확인해주세요.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#05070e] text-white relative overflow-hidden">
      <h1 className="text-6xl font-light tracking-[0.5em] ml-[0.5em] mb-4 drop-shadow-[0_0_20px_rgba(121,148,213,0.4)] z-10 transition-opacity duration-1000">
        E C H O
      </h1>
      <p className="text-white/50 mb-16 tracking-[0.2em] font-light text-sm z-10">
        마음을 비우고 편안하게 자신을 마주하세요
      </p>
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        <input 
          type="text" 
          placeholder="당신의 이름은 무엇인가요?" 
          className="bg-transparent border-b border-white/20 p-4 text-center text-xl focus:outline-none focus:border-white/60 transition-colors placeholder:text-white/20 w-80 font-light tracking-wider"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
        />
        <button 
          onClick={handleStart}
          className="px-10 py-4 rounded-full border border-white/20 hover:border-white/80 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 backdrop-blur-sm tracking-[0.1em] text-sm"
        >
          여정 시작하기
        </button>
      </div>

      {/* 배경 장식 파동 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-[#7994D5]/20 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] -z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-[#7994D5]/10 rounded-full animate-[ping_5s_cubic-bezier(0,0,0.2,1)_infinite] -z-10" style={{animationDelay: '1s'}}></div>
    </div>
  );
}
