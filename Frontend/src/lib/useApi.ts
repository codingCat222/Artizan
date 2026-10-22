import { useCallback, useEffect, useRef, useState } from "react";

/** Loads data from the API and exposes loading / error state plus a reload() trigger. */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        fetcherRef.current()
            .then((d) => { if (!cancelled) setData(d); })
            .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong."); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick]);

    const reload = useCallback(() => setTick((t) => t + 1), []);
    return { data, error, loading, reload };
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");