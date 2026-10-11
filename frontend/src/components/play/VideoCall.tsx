import { useEffect, useRef, useState } from "react";
import { Card, Button, message, Tooltip } from "antd";
import { LuVideo, LuVideoOff, LuMic, LuMicOff } from "react-icons/lu";
import { Socket } from "socket.io-client";
import { Player } from "../../types/types";

// Define props for the VideoStream sub-component
interface VideoStreamProps {
  stream: MediaStream;
  muted: boolean;
  username: string;
}

const VideoStream = ({ stream, muted, username }: VideoStreamProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-2 py-0.5 rounded">
        {username}
      </div>
    </div>
  );
};

// Define props for the main VideoCall component
interface VideoCallProps {
  socket: Socket | null;
  players: Player[];
  selfId?: string;
}

const VideoCall = ({ socket, players, selfId }: VideoCallProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Map<string, { stream: MediaStream; username: string }>
  >(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  localStreamRef.current = localStream;

  const drainCandidates = async (sid: string, pc: RTCPeerConnection) => {
    const queue = pendingCandidates.current.get(sid) || [];
    for (const cand of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn("Error adding queued ICE candidate:", err);
      }
    }
    pendingCandidates.current.delete(sid);
  };

  const getPeerConnection = (sid: string, username: string): RTCPeerConnection => {
    if (!peerConnections.current.has(sid)) {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStreamRef.current!));
      }

      pc.ontrack = (event: RTCTrackEvent) => {
        if (event.streams && event.streams[0]) {
          setRemoteStreams((prev) =>
            new Map(prev).set(sid, { stream: event.streams[0], username })
          );
        }
      };

      pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-ice-candidate", {
            to: sid,
            candidate: event.candidate,
          });
        }
      };

      peerConnections.current.set(sid, pc);
    }
    return peerConnections.current.get(sid)!;
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);

      // Add local tracks to existing peer connections and renegotiate
      peerConnections.current.forEach((pc, sid) => {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription && socket) {
              socket.emit("webrtc-offer", {
                to: sid,
                offer: pc.localDescription,
              });
            }
          })
          .catch((err) => console.error("Error creating renegotiation offer:", err));
      });
    } catch (error) {
      console.error("Error accessing media devices.", error);
      message.error("Could not access camera and microphone. Please check permissions.");
    }
  };

  const stopVideo = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
  };

  const toggleVideo = () => {
    if (isVideoEnabled) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const newAudioState = !isAudioEnabled;
      localStream.getAudioTracks().forEach((track) => (track.enabled = newAudioState));
      setIsAudioEnabled(newAudioState);
    }
  };

  // Always listen for incoming signaling so spectators/non-streamers can receive remote feeds
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const player = players.find((p: Player) => p.socketId === from);
      const username = player ? player.username : "Player";
      const pc = getPeerConnection(from, username);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await drainCandidates(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
      } catch (err) {
        console.error("Error handling WebRTC offer:", err);
      }
    };

    const handleAnswer = async ({
      from,
      answer,
    }: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = peerConnections.current.get(from);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainCandidates(from, pc);
        } catch (err) {
          console.error("Error handling WebRTC answer:", err);
        }
      }
    };

    const handleIceCandidate = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.current.get(from);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      } else {
        if (!pendingCandidates.current.has(from)) {
          pendingCandidates.current.set(from, []);
        }
        pendingCandidates.current.get(from)!.push(candidate);
      }
    };

    const handleUserLeft = (sid: string) => {
      if (peerConnections.current.has(sid)) {
        peerConnections.current.get(sid)?.close();
        peerConnections.current.delete(sid);
      }
      pendingCandidates.current.delete(sid);
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(sid);
        return newStreams;
      });
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket, players]);

  // When local video is enabled, initiate connection to peers that don't have one
  useEffect(() => {
    if (!socket || !isVideoEnabled || !localStream) return;

    players.forEach((player: Player) => {
      if (
        player.socketId &&
        player.socketId !== selfId &&
        !peerConnections.current.has(player.socketId)
      ) {
        const pc = getPeerConnection(player.socketId, player.username);
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription) {
              socket.emit("webrtc-offer", {
                to: player.socketId,
                offer: pc.localDescription,
              });
            }
          })
          .catch((err) => console.error("Error creating offer:", err));
      }
    });
  }, [socket, isVideoEnabled, localStream, players, selfId]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center">
          <LuVideo className="mr-2" />
          Video Chat
        </h3>
        <Button
          type={isVideoEnabled ? "default" : "primary"}
          icon={isVideoEnabled ? <LuVideoOff /> : <LuVideo />}
          onClick={toggleVideo}
          danger={isVideoEnabled}
        >
          {isVideoEnabled ? "Stop Video" : "Start Video"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {isVideoEnabled && localStream && (
          <div className="relative">
            <VideoStream stream={localStream} muted={true} username="You" />
            <div className="absolute top-1 right-1">
              <Tooltip title={isAudioEnabled ? "Mute" : "Unmute"}>
                <Button
                  icon={isAudioEnabled ? <LuMic /> : <LuMicOff />}
                  size="small"
                  shape="circle"
                  onClick={toggleAudio}
                  danger={!isAudioEnabled}
                />
              </Tooltip>
            </div>
          </div>
        )}

        {Array.from(remoteStreams.values()).map(
          ({ stream, username }, index) => (
            <VideoStream
              key={index}
              stream={stream}
              muted={false}
              username={username}
            />
          )
        )}
      </div>
      {!isVideoEnabled && remoteStreams.size === 0 && (
        <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Video is off</p>
        </div>
      )}
    </Card>
  );
};

export default VideoCall;