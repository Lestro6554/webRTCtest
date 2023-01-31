import './App.css';
import Room from './pages/Room/Room';
import Main from './pages/Main/Main';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotFound404 from './pages/NotFound404/NotFound404';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Main />}/>
          <Route path='/room/:id' element={<Room />}/>
          <Route path='*' element={<NotFound404 />}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
