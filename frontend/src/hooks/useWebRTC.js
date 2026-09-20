import { useRef, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({ onTrack, sendOffer, sendAnswer, sendIce }) {
  const peers       = useRef({});
  const localStream = useRef(null);

  // Keep signaling callbacks fresh without re-creating peer connections
  const sigRef = useRef({ sendOffer, sendAnswer, sendIce, onTrack });
  sigRef.current = { sendOffer, sendAnswer, sendIce, onTrack };

  const createPeer = useCallback((socketId) => {
    if (peers.current[socketId]) return peers.current[socketId];

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sigRef.current.sendIce(socketId, candidate);
    };

    pc.ontrack = ({ streams }) => {
      if (streams[0]) sigRef.current.onTrack(socketId, streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] ${socketId} state: ${pc.connectionState}`);
    };

    // Add local tracks immediately if stream is ready
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) =>
        pc.addTrack(t, localStream.current)
      );
    }

    peers.current[socketId] = pc;
    return pc;
  }, []);

  // Set local stream — also adds tracks to any existing peers
  const setLocalStream = useCallback((stream) => {
    localStream.current = stream;
    Object.entries(peers.current).forEach(([, pc]) => {
      stream.getTracks().forEach((t) => {
        if (!pc.getSenders().find((s) => s.track?.kind === t.kind)) {
          pc.addTrack(t, stream);
        }
      });
    });
  }, []);

  // Caller side: create peer → add tracks → offer
  const callPeer = useCallback(async (socketId) => {
    const pc = createPeer(socketId);
    // Ensure local tracks are on this peer before creating offer
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => {
        if (!pc.getSenders().find((s) => s.track?.kind === t.kind)) {
          pc.addTrack(t, localStream.current);
        }
      });
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sigRef.current.sendOffer(socketId, offer);
  }, [createPeer]);

  // Callee side: receive offer → add tracks → answer
  const handleOffer = useCallback(async (from, offer) => {
    const pc = createPeer(from);
    // Ensure local tracks are on this peer before answering
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => {
        if (!pc.getSenders().find((s) => s.track?.kind === t.kind)) {
          pc.addTrack(t, localStream.current);
        }
      });
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sigRef.current.sendAnswer(from, answer);
  }, [createPeer]);

  const handleAnswer = useCallback(async (from, answer) => {
    const pc = peers.current[from];
    if (pc && pc.signalingState !== "stable") {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleIce = useCallback(async (from, candidate) => {
    const pc = peers.current[from];
    if (pc) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    }
  }, []);

  const removePeer = useCallback((socketId) => {
    peers.current[socketId]?.close();
    delete peers.current[socketId];
  }, []);

  const closeAll = useCallback(() => {
    Object.values(peers.current).forEach((pc) => pc.close());
    peers.current = {};
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
  }, []);

  return { setLocalStream, callPeer, handleOffer, handleAnswer, handleIce, removePeer, closeAll };
}
