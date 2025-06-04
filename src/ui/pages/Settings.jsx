import React, { useEffect, useState } from 'react';
import { handleConnectClick, SERVER_URL_KEY } from '../hooks/useSocket';
import { useSocketStore } from '../store/socketStore';

// Константы для позиций трея
export const TRAY_POSITION_KEY = 'tray_position';
const TRAY_POSITIONS = {
  TOP: 'top-center',
  BOTTOM: 'bottom-center',
  LEFT: 'left-center',
  RIGHT: 'right-center',
};

export const Settings = () => {
  const [url, setUrl] = useState(localStorage.getItem(SERVER_URL_KEY)?.replace('http://', '') || '');
  const [platform, setPlatform] = useState('');
  const [hostname, setHostname] = useState('');
  const [trayPosition, setTrayPosition] = useState(
    localStorage.getItem(TRAY_POSITION_KEY) || TRAY_POSITIONS.BOTTOM
  );

  const { clients, updateClientNameAndOrder } = useSocketStore();
  const [editNames, setEditNames] = useState({});
  const [editOrders, setEditOrders] = useState({});

  const changeUrl = (event) => {
    let inputUrl = event.target.value;
    
    inputUrl = inputUrl.replace('http://', '');
    setUrl(inputUrl);
  };

  const connectToServer = () => {
    if (url.length > 0) {
      
      localStorage.setItem(SERVER_URL_KEY, url);
      handleConnectClick(localStorage.getItem(SERVER_URL_KEY));
    }
  }

  const handleNameChange = (id, newName) => {
    setEditNames(prev => ({ ...prev, [id]: newName }));
  };

  const handleOrderChange = (id, newOrder) => {
    setEditOrders(prev => ({ ...prev, [id]: newOrder }));
  };

  const handleApplyName = (id) => {
    const name = editNames[id];
    const order = editOrders[id];
    
    // Используем новую функцию для обновления имени и порядка одновременно
    updateClientNameAndOrder(id, name?.trim(), order);
    
    // Очищаем состояние редактирования
    setEditNames(prev => {
      const newState = {...prev};
      delete newState[id];
      return newState;
    });
    
    setEditOrders(prev => {
      const newState = {...prev};
      delete newState[id];
      return newState;
    });
  };

  const handleTrayPositionChange = (position) => {
    setTrayPosition(position);
    localStorage.setItem(TRAY_POSITION_KEY, position);
    // Отправляем новую позицию в main process
    window.electron.setTrayPosition(position);
  };

  useEffect(() => {
    window.electron.getInfo().then(data=>{
      setPlatform(data.platform);
      setHostname(data.hostname);
    });
  }, []);

  // Загружаем сохраненные порядковые номера при инициализации
  useEffect(() => {
    const orders = {};
    clients.forEach(client => {
      const savedOrder = localStorage.getItem(`client_order`);
      if (savedOrder !== null) {
        orders[client.id] = savedOrder;
      }
    });
    setEditOrders(orders);
  }, [clients]);

  return (
    <div className="py-4 px-10">
      <div className="pb-4 pl-10 flex justify-between items-center">
        <h2 className="block">Настройки</h2>
      </div>
      <div className="text-center">
        <label className="input">
          <span className="label">http://</span>
          <input 
            type="text" 
            placeholder="localhost:5000" 
            value={url} 
            onChange={changeUrl} 
          />
        </label>
        <button 
          className="btn" 
          onClick={connectToServer}
          disabled={!url}
        >
          Подключиться
        </button>
      </div>
      <div className="divider"></div>
      <div className="mt-4">
        <h2>Имя компьютера: {hostname}</h2>
        <h3>OС: {platform}</h3>
        <div>

          {platform === 'linux' ? (
          <>
            <p><br/>
              Для корректной работы приложение в OS Linux необходимо установить amixer. Вы можете это сделать выполнив следующие команды в терминале:<br/><br/>
              sudo apt update<br/>
              sudo apt install alsa-utils
            </p>
            <div className="text-center">
              <button className="btn btn-sm" onClick={() => window.electron.openLinuxInstallTerminal()}>
                Установить alsa-utils
              </button>
            </div>
          </>
          ) : (
            <p>Для корректной работы приложения в OS Windows необходим пакет VCRUNTIME.dll для x86 архитектуры.<br/>
            Вы можете его скачать здесь: <a href='https://aka.ms/vs/17/release/vc_redist.x86.exe'>https://aka.ms/vs/17/release/vc_redist.x86.exe</a></p>
          )}
          
        </div>
      </div>
      <div className="divider"></div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Подключённые клиенты:</h3>
        {clients.length === 0 ? (
          <p className="text-gray-500">Нет подключённых клиентов.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 shadow-sm"
              >
                <div className="text-xs text-gray-500 break-all">{client.id}</div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    className="input input-sm w-full sm:w-48"
                    value={editNames[client.id] ?? client.name}
                    onChange={(e) => handleNameChange(client.id, e.target.value)}
                  />
                  <input
                    type="number"
                    className="input input-sm w-20"
                    placeholder="Порядок"
                    min="1"
                    value={editOrders[client.id] ?? '0'}
                    onChange={(e) => handleOrderChange(client.id, e.target.value)}
                  />
                  <button
                    className="btn btn-sm"
                    onClick={() => handleApplyName(client.id)}
                  >
                    Применить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="divider"></div>

      <div className="mt-6 px-4 pb-4">
        <h3 className="text-lg font-semibold mb-2">Настройки трея:</h3>
        <div className="flex flex-col gap-2">
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input 
                type="radio" 
                name="tray-position" 
                className="radio radio-sm" 
                checked={trayPosition === TRAY_POSITIONS.TOP}
                onChange={() => handleTrayPositionChange(TRAY_POSITIONS.TOP)}
              />
              <span className="label-text">Сверху по центру</span>
            </label>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input 
                type="radio" 
                name="tray-position" 
                className="radio radio-sm" 
                checked={trayPosition === TRAY_POSITIONS.BOTTOM}
                onChange={() => handleTrayPositionChange(TRAY_POSITIONS.BOTTOM)}
              />
              <span className="label-text">Снизу по центру</span>
            </label>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input 
                type="radio" 
                name="tray-position" 
                className="radio radio-sm" 
                checked={trayPosition === TRAY_POSITIONS.LEFT}
                onChange={() => handleTrayPositionChange(TRAY_POSITIONS.LEFT)}
              />
              <span className="label-text">Слева по центру</span>
            </label>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input 
                type="radio" 
                name="tray-position" 
                className="radio radio-sm" 
                checked={trayPosition === TRAY_POSITIONS.RIGHT}
                onChange={() => handleTrayPositionChange(TRAY_POSITIONS.RIGHT)}
              />
              <span className="label-text">Справа по центру</span>
            </label>
          </div>
        </div>
      </div>
      
      
    </div>
  );
};
