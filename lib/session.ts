const encoder = new TextEncoder()

async function getKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        encoder.encode(process.env.SESSION_SECRET!),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    )
}

export async function signSession(value: string): Promise<string> {
    const key = await getKey()
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
    const b64url = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    return `${value}.${b64url}`
}

export async function unsignSession(signed: string): Promise<string | null> {
    const dot = signed.lastIndexOf('.')
    if (dot === -1) return null
    const value = signed.slice(0, dot)
    const sigB64 = signed.slice(dot + 1).replace(/-/g, '+').replace(/_/g, '/')
    const sigBuf = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))
    const key = await getKey()
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, encoder.encode(value))
    return valid ? value : null
}