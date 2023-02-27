import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './App.css';
import Room from './pages/Room/Room';
import Main from './pages/Main/Main';
import NotFound404 from './pages/NotFound404/NotFound404';
import { StompProvider } from './providers/StompClient';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <StompProvider>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/room/:id' element={<Room />} />
            <Route path='*' element={<NotFound404 />} />
          </Routes>
        </StompProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
