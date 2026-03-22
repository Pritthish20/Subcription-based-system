import { useEffect, useState } from "react";
import { request } from "../../lib";

export function useRemoteCollection<T>(path: string, fallback: T[]) {
  const [items, setItems] = useState<T[]>(fallback);

  useEffect(() => {
    let active = true;
    request<T[]>(path)
      .then((data) => {
        if (active && data.length) setItems(data);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [path]);

  return items;
}
