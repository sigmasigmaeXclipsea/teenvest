import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type CopyEdge = {
  copierId: string;
  targetId: string;
  createdAt: string;
};

const COPIED_KEY_PREFIX = 'teenvest.copyTrading.copied';
const COPY_GRAPH_KEY = 'teenvest.copyTrading.graph';
const ACTIVE_COPY_KEY_PREFIX = 'teenvest.copyTrading.active';

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('Failed to parse copy trading data:', error);
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getCopiedKey = (userId: string) => `${COPIED_KEY_PREFIX}.${userId}`;
const getActiveCopyKey = (userId: string) => `${ACTIVE_COPY_KEY_PREFIX}.${userId}`;

export const useCopyTrading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copyGraph, setCopyGraph] = useState<CopyEdge[]>([]);
  const [activeCopyId, setActiveCopyIdState] = useState<string | null>(null);
  const [latestFollowerDelta, setLatestFollowerDelta] = useState(0);
  const previousFollowerCountRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    const storedGraph = readJson<CopyEdge[]>(COPY_GRAPH_KEY, []);
    const legacyCopied = readJson<string[]>(getCopiedKey(user.id), []);
    let nextGraph = storedGraph;

    if (legacyCopied.length > 0) {
      const existingTargets = new Set(
        storedGraph
          .filter((edge) => edge.copierId === user.id)
          .map((edge) => edge.targetId)
      );
      const additions = legacyCopied
        .filter((id) => id !== user.id && !existingTargets.has(id))
        .map((id) => ({
          copierId: user.id,
          targetId: id,
          createdAt: new Date().toISOString(),
        }));
      if (additions.length > 0) {
        nextGraph = [...storedGraph, ...additions];
        writeJson(COPY_GRAPH_KEY, nextGraph);
      }
    }

    setCopyGraph(nextGraph);
    const storedActive = readJson<string | null>(getActiveCopyKey(user.id), null);
    setActiveCopyIdState(storedActive);
    previousFollowerCountRef.current = nextGraph.filter((edge) => edge.targetId === user.id).length;
    setLatestFollowerDelta(0);
  }, [user?.id]);

  const copiedIds = useMemo(() => {
    if (!user) return [];
    return copyGraph
      .filter((edge) => edge.copierId === user.id)
      .map((edge) => edge.targetId);
  }, [copyGraph, user?.id]);

  useEffect(() => {
    if (!user) return;
    if (activeCopyId && copiedIds.includes(activeCopyId)) return;
    const nextActive = copiedIds[0] ?? null;
    setActiveCopyIdState(nextActive);
    writeJson(getActiveCopyKey(user.id), nextActive);
  }, [activeCopyId, copiedIds, user?.id]);

  const setActiveCopyId = useCallback(
    (targetId: string | null) => {
      if (!user) return;
      setActiveCopyIdState(targetId);
      writeJson(getActiveCopyKey(user.id), targetId);
    },
    [user]
  );

  const toggleCopy = useCallback(
    (targetUserId: string, displayName?: string | null) => {
      if (!user) return;
      if (targetUserId === user.id) return;

      setCopyGraph((prev) => {
        const existing = prev.find(
          (edge) => edge.copierId === user.id && edge.targetId === targetUserId
        );
        const next = existing
          ? prev.filter(
              (edge) => !(edge.copierId === user.id && edge.targetId === targetUserId)
            )
          : [
              ...prev,
              {
                copierId: user.id,
                targetId: targetUserId,
                createdAt: new Date().toISOString(),
              },
            ];

        writeJson(COPY_GRAPH_KEY, next);

        toast({
          title: existing ? 'Stopped copying' : 'Portfolio copied',
          description: existing
            ? `You are no longer copying ${displayName || 'this trader'}.`
            : `You will now mirror ${displayName || 'this trader'} in a phantom portfolio.`,
        });

        return next;
      });
    },
    [toast, user]
  );

  const isCopied = useCallback(
    (targetUserId: string) => copiedIds.includes(targetUserId),
    [copiedIds]
  );

  const getFollowerCount = useCallback(
    (userId: string) => copyGraph.filter((edge) => edge.targetId === userId).length,
    [copyGraph]
  );

  const currentUserFollowers = useMemo(() => {
    if (!user) return 0;
    return copyGraph.filter((edge) => edge.targetId === user.id).length;
  }, [copyGraph, user]);

  useEffect(() => {
    if (!user) return;
    const count = copyGraph.filter((edge) => edge.targetId === user.id).length;
    const delta = count - previousFollowerCountRef.current;
    setLatestFollowerDelta(delta > 0 ? delta : 0);
    previousFollowerCountRef.current = count;
  }, [copyGraph, user?.id]);

  return {
    copiedIds,
    activeCopyId,
    setActiveCopyId,
    isCopied,
    toggleCopy,
    getFollowerCount,
    currentUserFollowers,
    latestFollowerDelta,
  };
};
