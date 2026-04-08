import { QueryClient, QueryFunction } from "@tanstack/react-query";

function isApiHtmlFallback(res: Response, requestUrl: string): boolean {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const isHtml = contentType.includes("text/html");
  const isApiPath = /^\/api(\/|$)/.test(requestUrl) || /\/api(\/|$)/.test(res.url);
  return isHtml && isApiPath;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error("API response error", {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      body: text,
    });
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (error) {
    console.error("API network error", { method, url, error });
    throw error;
  }
  if (isApiHtmlFallback(res, url)) {
    throw new Error("Backend API is not configured. Set NEXT_PUBLIC_API_URL in Vercel.");
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const targetUrl = queryKey.join("/") as string;
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        credentials: "include",
      });
    } catch (error) {
      console.error("Query network error", { queryKey, error });
      throw error;
    }
    if (isApiHtmlFallback(res, targetUrl)) {
      throw new Error("Backend API is not configured. Set NEXT_PUBLIC_API_URL in Vercel.");
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
