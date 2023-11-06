import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './App.css'
import {
    createBrowserRouter,
    RouterProvider, Link,
} from "react-router-dom";
import {Space} from "antd";

const Root = () => {
    return (
        <Space direction={'vertical'}>
            <Space>
                <Link to={'tracer'}>Tracer</Link>
                |
                <Link to={'aaui'}>Abstract Account</Link>
                |
                <Link to={'storage'}>Storage</Link>
            </Space>
        </Space>
    )
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <Root/>,
    },
    {
        path: "aaui",
        async lazy() {
            const {MyLayout} = await import("./eip4337/Layout.tsx");
            // abstract account
            return {Component: MyLayout};
        },
    }, {
        path: "tracer",
        async lazy() {
            const {Tracer} = await import("./tx-tracer/Tracer.tsx");
            return {Component: Tracer};
        },
    }, {
        path: "storage", async lazy() {
            const {TxPage} = await import("./storage/TxList.tsx");
            return {Component: TxPage};
        },
        children: [
            {
                index: true, async lazy() {
                    const {TxList} = await import("./storage/TxList.tsx");
                    return {Component: TxList};
                },
            },
            {
                path: 'detail/:txSeq',
                async lazy() {
                    const {TxDetailWrap} = await import("./storage/TxDetail.tsx");
                    return {Component: TxDetailWrap};
                }
            }
        ]
    },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>,
)
