import './App.css';
import { HashRouter  } from 'react-router';
import { Router } from './components/Router';
import { PORT, useServerStore } from './store/serverStore';
import { useEffect } from 'react';

function App() {
  const { toggleServer, checkServerStatus } = useServerStore();

  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);
  
  useEffect(() => {
    const port = localStorage.getItem(PORT);
    if (port) {
      window.electron.isServerRunning().then(running => {
        if (!running) {
          toggleServer();
          console.log('server started')
        }
      });
    }
  }, []); 
    
  return (
    <HashRouter >
      <Router />
    </HashRouter >
  );
}

export default App;
