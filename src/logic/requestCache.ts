import {fetchJson} from "ethers/lib/utils";

const map = new Map<string, Promise<any>>();
export async function fetchWithCache(url: string) {
    if (map.has(url)) {
        return map.get(url)
    }
    const req = fetchJson(url);
    map.set(url, req);
    return req;
}