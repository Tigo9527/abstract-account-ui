import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {MyLayout} from "./eip4337/Layout.tsx";
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MyLayout/>
    </React.StrictMode>,
)
