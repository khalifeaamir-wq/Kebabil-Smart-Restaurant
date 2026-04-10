import { supabase } from "@/lib/supabase";

type AppImportMetaEnv = ImportMetaEnv & {
  NEXT_PUBLIC_API_URL?: string;
  VITE_API_URL?: string;
};

const env = import.meta.env as AppImportMetaEnv;

function normalizeBaseUrl(value?: string): string {
  if (!value) return "";
  return value.trim().replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(
  env.NEXT_PUBLIC_API_URL || env.VITE_API_URL,
);

function shouldRewriteRelativeApiUrl(url: string): boolean {
  return /^\/api(\/|$)/.test(url);
}

function isApiAbsoluteUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return /^\/api(\/|$)/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function withApiBase(url: string): string {
  if (!API_BASE_URL || !shouldRewriteRelativeApiUrl(url)) return url;
  return `${API_BASE_URL}${url}`;
}

export function installApiBaseFetchPatch() {
  if (typeof window === "undefined") return;

  const fetchRef = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let targetUrl: string | null = null;
    let nextInput: RequestInfo | URL = input;
    let nextInit: RequestInit | undefined = init;

    if (typeof input === "string") {
      targetUrl = withApiBase(input);
      nextInput = targetUrl;
    } else if (input instanceof URL) {
      targetUrl = withApiBase(input.toString());
      nextInput = targetUrl;
    } else if (input instanceof Request) {
      const reqUrl = new URL(input.url);
      if (
        API_BASE_URL &&
        reqUrl.origin === window.location.origin &&
        shouldRewriteRelativeApiUrl(reqUrl.pathname)
      ) {
        targetUrl = `${API_BASE_URL}${reqUrl.pathname}${reqUrl.search}`;
        nextInput = new Request(targetUrl, input);
      } else {
        targetUrl = input.url;
      }
    }

    if (targetUrl && isApiAbsoluteUrl(targetUrl)) {
      const headers = new Headers(
        input instanceof Request ? input.headers : undefined,
      );
      if (nextInit?.headers) {
        new Headers(nextInit.headers).forEach((value, key) => headers.set(key, value));
      }

      if (!headers.has("Authorization")) {
        try {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) headers.set("Authorization", `Bearer ${token}`);
        } catch {
          // no-op: continue without token if session is unavailable
        }
      }

      nextInit = { ...nextInit, headers };
    }

    return fetchRef(nextInput, nextInit);
  };
}

export function getWebSocketUrl(path = "/ws"): string {
  if (!API_BASE_URL) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${path}`;
  }

  const backend = new URL(API_BASE_URL);
  backend.protocol = backend.protocol === "https:" ? "wss:" : "ws:";
  backend.pathname = path;
  backend.search = "";
  backend.hash = "";
  return backend.toString();
}
