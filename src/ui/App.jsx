import './App.css';
import { BrowserRouter } from 'react-router';
import { Router } from './components/Router';
import { useSocket } from './hooks/useSocket';

function App() {
  useSocket();

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
