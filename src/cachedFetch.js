export default async function cachedFetch({url, expiry}) {
    const cachedString = localStorage.getItem(url);
    if(cachedString) {
        const cached = JSON.parse(cachedString);
        if(cached.expiry < Date.now()) localStorage.removeItem(url);
        else return cached.data;
    }
    const fetched = await fetch(url);
    const data = await fetched.json();
    localStorage.setItem(
        url,
        JSON.stringify({data: data, expiry: expiry})
    );
    return data;
}
