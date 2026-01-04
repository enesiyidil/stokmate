import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App.tsx'
import './index.css'
import { UiProvider } from './context/UiContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <UiProvider>
        <App />
      </UiProvider>
    </Provider>
  </React.StrictMode>,
)
