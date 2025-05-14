import './App.css';
import { HashRouter  } from 'react-router';
import { Router } from './components/Router';
import { useSocket } from './hooks/useSocket';

function App() {
  useSocket();

  return (
    <HashRouter >
      <Router />
    </HashRouter >
  );
}

export default App;
