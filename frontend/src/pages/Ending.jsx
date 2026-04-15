import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PERSONAS = {
  OBSERVER: {
    title: "침묵하는 고요의 관찰자",
    subtitle: "The Silent Observer",
    color: "#7994D5", // 은은한 파란색
    gradient: "from-[#7994D5]/20 to-transparent",
    tags: ["안정적", "내적 평화", "수용적"],
    description: "당신은 어둠 속에서도 자신만의 템포를 잃지 않는 사람입니다. 예측할 수 없는 상황이나 압박감 속에서도 깊은 호흡을 유지하며, 문제를 직면하기보다 포용하는 방식으로 나아갑니다."
  },
  PIONEER: {
    title: "빛을 좇는 영혼의 개척자",
    subtitle: "The Luminous Pioneer",
    color: "#D5A579", // 따뜻한 황금색
    gradient: "from-[#D5A579]/20 to-transparent",
    tags: ["도전적", "목표지향적", "추진력"],
    description: "장애물은 당신에게 포기할 이유가 아니라 넘어서야 할 과정일 뿐입니다. 어둠을 뚫고 지나갔을 때의 성취감에 집중하며, 역동적인 에너지로 길을 만들어갑니다."
  },
  SINGER_IN_DARK: {
    title: "어둠 속에서 진실을 노래하는 새",
    subtitle: "The Truthful Singer",
    color: "#A279D5", // 보라색
    gradient: "from-[#A279D5]/20 to-transparent",
    tags: ["솔직함", "직면하는 용기", "감성적"],
    description: "불안과 답답함을 느끼는 것은 약함이 아닙니다. 당신은 자신의 혼란스러운 감정을 있는 그대로 바라보고 솔직하게 표현할 줄 아는 용기를 지녔습니다."
  },
  CAUTIOUS_SOUL: {
    title: "심연을 거니는 조심스러운 방랑자",
    subtitle: "The Cautious Wanderer",
    color: "#79D5A5", // 옥색/청록색
    gradient: "from-[#79D5A5]/20 to-transparent",
    tags: ["신중함", "섬세함", "자기보호"],
    description: "주변의 환경에 매우 섬세하게 반응하며, 돌다리도 두들겨 보고 건너는 신중함을 지녔습니다. 아직은 내면의 소리를 완전히 꺼내지 않았지만, 조심스럽게 자신만의 길을 찾고 있습니다."
  }
};

function analyzeJournals(journals) {
  if (!journals || journals.length === 0) return PERSONAS.OBSERVER; // 기본값

  let calmCount = 0;   // 평온, 안도
  let activeCount = 0; // 성취
  let anxiousCount = 0;// 두려움, 답답함
  let totalNoteLength = 0;

  journals.forEach(j => {
    if (j.emotion === '평온함' || j.emotion === '안도감') calmCount++;
    else if (j.emotion === '성취감') activeCount++;
    else if (j.emotion === '두려움' || j.emotion === '답답함') anxiousCount++;
    
    totalNoteLength += j.notes ? j.notes.length : 0;
  });

  const avgNoteLength = totalNoteLength / journals.length;

  const maxType = Math.max(calmCount, activeCount, anxiousCount);

  if (maxType === calmCount) {
    return PERSONAS.OBSERVER;
  } else if (maxType === activeCount) {
    return PERSONAS.PIONEER;
  } else {
    // 불안/답답함을 가장 많이 느낀 경우, 텍스트 길이가 20자 이상이면 활발히 표현(SINGER), 아니면 응축(CAUTIOUS)
    if (avgNoteLength >= 15) {
      return PERSONAS.SINGER_IN_DARK;
    } else {
      return PERSONAS.CAUTIOUS_SOUL;
    }
  }
}

export default function Ending() {
  const [persona, setPersona] = useState(null);
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
        const resultPersona = analyzeJournals(data);
        setPersona(resultPersona);
      } catch (err) {
        console.error(err);
      } finally {
        // 부드러운 전환을 위해 약간의 딜레이
        setTimeout(() => setLoading(false), 1500);
      }
    };
    fetchJournals();
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#05070e] flex flex-col items-center justify-center text-white/50 space-y-4">
        <div className="w-16 h-16 border-t-2 border-white/20 rounded-full animate-spin"></div>
        <p className="tracking-[0.2em] font-light text-sm animate-pulse">당신의 여정을 되돌아보고 있습니다...</p>
      </div>
    );
  }

  // 글래스모피즘 동적 테마 색상 적용
  const shadowColor = persona?.color || '#ffffff';

  return (
    <div className="min-h-screen bg-[#05070e] text-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* 백그라운드 효과 (페르소나 색상에 맞춰 변화) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 transition-all duration-1000 -z-10 pointer-events-none"
        style={{ backgroundColor: shadowColor }}
      ></div>

      <div className="max-w-xl w-full flex flex-col items-center z-10 animate-fade-in-up space-y-12">
        <h1 className="text-white/30 tracking-widest text-sm uppercase">심리 분석 보고서</h1>

        {/* 페르소나 카드 */}
        <div className="relative w-full aspect-[4/5] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl overflow-hidden group hover:border-white/20 transition-colors duration-500">
          
          {/* 카드 내부 그라데이션 장식 */}
          <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${persona.gradient} opacity-50`}></div>

          <p className="text-white/50 font-light tracking-[0.3em] text-xs mt-4 hover:text-white/80 transition-colors uppercase z-10">Echo Therapy Persona</p>
          
          <div className="flex-1 flex flex-col items-center justify-center z-10 w-full">
            {/* 심볼 (추상적인 원 형태) */}
            <div 
              className="w-32 h-32 rounded-full border border-white/20 mb-8 flex items-center justify-center relative"
              style={{ boxShadow: `0 0 40px ${shadowColor}40` }}
            >
              <div 
                className="w-16 h-16 rounded-full blur-[10px]"
                style={{ backgroundColor: shadowColor }}
              ></div>
            </div>

            <h2 className="text-3xl font-light tracking-wide mb-2" style={{ color: shadowColor }}>{persona.title}</h2>
            <h3 className="text-sm font-light tracking-widest text-white/40 mb-8">{persona.subtitle}</h3>
            
            <div className="flex gap-2 mb-8">
              {persona.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>

            <p className="text-white/70 font-light leading-relaxed text-sm md:text-base px-4">
              {persona.description}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/mypage')}
          className="px-8 py-3 rounded-full border border-white/20 hover:border-white/80 hover:bg-white/5 transition-all duration-300 tracking-[0.2em] font-light text-sm"
        >
          나의 일지 기록 보기
        </button>
      </div>

    </div>
  );
}
