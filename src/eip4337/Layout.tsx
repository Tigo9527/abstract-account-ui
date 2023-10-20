import {Account} from "./Account.tsx";

export function MyLayout() {
    window.document.title = 'Abstract Account Demo'
    return (
        <>
            <Account/>
        </>
    )
}