import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after
 * the user stops changing it for `delay` ms.
 *
 * Usage:
 *   const debouncedTopic = useDebounce(topic, 400);
 */
export function useDebounce<T>(value: T, delay = 400): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}

/**
 * Returns a stable debounced version of `fn` that only executes
 * after `delay` ms have passed since the last call.
 *
 * Usage:
 *   const debouncedGenerate = useDebouncedCallback(generate, 400);
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
    fn: T,
    delay = 400,
): T {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fnRef = useRef(fn);
    fnRef.current = fn; // always stay current without breaking stability

    return useCallback((...args: unknown[]) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            fnRef.current(...args);
        }, delay);
    }, [delay]) as T;
}
