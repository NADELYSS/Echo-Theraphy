import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import MyPage from './pages/MyPage';
import Ending from './pages/Ending';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/ending" element={<Ending />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
