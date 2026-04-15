import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyPage() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    const fetchJournals = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/journals/${userId}`);
        const data = await res.json();
        setJournals(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [userId, navigate]);

  if (loading) return <div className="h-screen bg-[#05070e] text-white flex items-center justify-center tracking-widest font-light">기록을 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-[#05070e] text-white p-10 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto relative z-10 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-white/10 pb-6 gap-6">
          <div>
            <h1 className="text-4xl font-light tracking-widest mb-3">{username}님의 여정 기록</h1>
            <p className="text-white/40 tracking-wider font-light">어둠 속에서 당신이 남긴 감정의 흔적들입니다.</p>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }} 
            className="text-white/50 hover:text-white transition-colors border border-white/10 hover:border-white/40 px-6 py-2 rounded-full text-sm tracking-widest bg-transparent"
          >
            처음으로 돌아가기
          </button>
        </header>

        {journals.length === 0 ? (
          <div className="text-center text-white/30 py-24 tracking-[0.2em] font-light">
            아직 기록된 여정이 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {journals.map((journal) => (
              <div key={journal.id} className="bg-white/5 border border-white/5 p-8 rounded-3xl flex flex-col md:flex-row md:items-start gap-6 hover:bg-white/10 transition-all duration-500 shadow-xl">
                <div className="md:w-1/4 shrink-0 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6">
                  <span className="text-sm text-[#7994D5] tracking-[0.3em] font-medium">STAGE {journal.stage}</span>
                  <span className="text-3xl font-light bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{journal.emotion}</span>
                  <span className="text-xs text-white/30 tracking-widest">{new Date(journal.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="md:w-3/4 flex items-center md:pl-4 text-white/80 font-light leading-loose text-lg">
                  {journal.notes || <span className="italic text-white/30">남겨진 기록이 없습니다.</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 마이페이지 은은한 배경 효과 */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#7994D5]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 -z-10 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 -z-10 pointer-events-none"></div>
    </div>
  );
}
