import { useEffect, useCallback, useRef, ReactNode, createContext, useContext, useState } from "react";
import { gatewayWebSocketUrl, parseWsMessage } from "@/lib/admin/ws";

type WsCallback = (payload: unknown) => void;

interface WebsocketContextType {
  isReady: boolean;
  subscribe: (channel: string, callback: WsCallback) => () => void;
}

const WebsocketContext = createContext<WebsocketContextType | null>(null);

const RECONNECT_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

export function WebsocketContextProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<WsCallback>>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_MS);
  const unmountedRef = useRef(false);

  const [isReady, setIsReady] = useState(false);

  const subscribe = useCallback((channel: string, callback: WsCallback): (() => void) => {
    let set = listenersRef.current.get(channel);
    if (!set) {
      set = new Set();
      listenersRef.current.set(channel, set);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "subscribe", channel }));
      }
    }
    set.add(callback);

    return () => {
      const currentSet = listenersRef.current.get(channel);
      if (!currentSet) return;
      currentSet.delete(callback);
      if (currentSet.size === 0) {
        listenersRef.current.delete(channel);
      }
    };
  }, []);

  useEffect(() => {
    unmountedRef.current = false;

    const connect = () => {
      if (unmountedRef.current) return;

      const ws = new WebSocket(gatewayWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelayRef.current = RECONNECT_MS;
        setIsReady(true);
        for (const channel of listenersRef.current.keys()) {
          ws.send(JSON.stringify({ type: "subscribe", channel }));
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        setIsReady(false);
        if (!unmountedRef.current) {
          const delay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(delay * 2, RECONNECT_MAX_MS);
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      };

      ws.onmessage = (ev) => {
        const msg = parseWsMessage(String(ev.data));
        if (!msg || msg.type !== "event") return;

        const channelListeners = listenersRef.current.get(msg.channel);
        channelListeners?.forEach((cb) => {
          try {
            cb(msg.payload);
          } catch (err) {
            console.error(`WS callback error [${msg.channel}]:`, err);
          }
        });
      };

      ws.onerror = () => {
        // onclose handles reconnect
      };
    };

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      setIsReady(false);
    };
  }, []);

  return (
    <WebsocketContext.Provider value={{ isReady, subscribe }}>
      {children}
    </WebsocketContext.Provider>
  );
}

export function useWebsocketSubscription() {
  const context = useContext(WebsocketContext);
  if (!context) {
    throw new Error("useWebsocketSubscription must be used within a WebsocketContextProvider");
  }
  return context;
}
