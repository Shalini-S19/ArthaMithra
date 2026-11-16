
async function api(method, url, body = null) {
    const response = await fetch(url, {
        method: method,
        credentials: "same-origin",
        headers: body
            ? { "Content-Type": "application/json" }
            : {},
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}
