import React, { useState } from 'react';
import { StatusIcon } from '../components/StatusIcon';

const urls = [
  { id: 0, type: 'localhost', url: 'url' },
  { id: 1, type: 'localhost', url: 'url' },
  { id: 2, type: 'localhost', url: 'url' },
]
export const Server = () => {
  const [isChecked, setIsChecked] = useState(false)
  
  const toggleServer = () => {
    setIsChecked(prev => !prev)
  }

  return (
    <div className=''>
      Server Page
      <label className="input">
        <span className="label">PORT</span>
        <input type="text" placeholder="5000" />
      </label>
      <button className="btn btn-soft">Применить</button>
      <StatusIcon isTrue={false} />
      <div>
        <div>URL для подключения:</div>
        {urls.map(item=>(
          <div className="url-item" key={item.id}>
            <span className="url-type">{item.type}:</span>
            <span className="url-value">{item.url}</span>
            <button>Скопировать</button>
          </div>
        ))}
      </div>
      <input 
          type="checkbox" 
          className="toggle toggle-primary" 
          checked={isChecked}
          onChange={toggleServer}
        />
    </div>
  )
}
