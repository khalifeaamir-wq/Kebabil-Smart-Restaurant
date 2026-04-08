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

function withApiBase(url: string): string {
  if (!API_BASE_URL || !shouldRewriteRelativeApiUrl(url)) return url;
  return `${API_BASE_URL}${url}`;
}

export function installApiBaseFetchPatch() {
  if (typeof window === "undefined") return;

  const fetchRef = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") {
      return fetchRef(withApiBase(input), init);
    }

    if (input instanceof URL) {
      return fetchRef(withApiBase(input.toString()), init);
    }

    if (input instanceof Request) {
      const reqUrl = new URL(input.url);
      if (
        API_BASE_URL &&
        reqUrl.origin === window.location.origin &&
        shouldRewriteRelativeApiUrl(reqUrl.pathname)
      ) {
        const rewritten = new Request(
          `${API_BASE_URL}${reqUrl.pathname}${reqUrl.search}`,
          input,
        );
        return fetchRef(rewritten, init);
      }
    }

    return fetchRef(input, init);
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
