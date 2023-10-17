import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {MyLayout} from "./eip4337/Layout.tsx";
import './App.css'
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import {Tracer} from "./tx-tracer/Tracer.tsx";
import {UploadElem} from "./storage/Upload.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MyLayout/>,
    },{
        path: "/tracer", element: <Tracer/>,
    },{
        path: "/storage", element: <UploadElem/>,
    }
], {
    basename: undefined,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
