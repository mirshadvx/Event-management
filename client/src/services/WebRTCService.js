import api from "./api";
import chatApi from "./user/chat/chatApi";

class WebRTCService {
  constructor() {
    this.peerConnections = new Map();
    this.localStream = null;
    this.remoteStreams = new Map();
    this.ws = null;
    this.roomId = null;
    this.userId = null;
    this.userName = null;
    this.isHost = false;
    this.onRemoteStreamCallback = null;
    this.onStreamEndedCallback = null;
    this.onUserJoinedCallback = null;
    this.onUserLeftCallback = null;
  }

  getRTCConfiguration() {
    return {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
  }

  async connectWebSocket(roomId, userId, userName, isHost = false) {
    console.log("[WebRTCService] Connecting WebSocket:", {
      roomId,
      userId,
      userName,
      isHost,
    });
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.isHost = isHost;

    console.log("[WebRTCService] Getting authentication token...");
    const token = await this.getAuthToken();
    if (!token) {
      console.error("[WebRTCService] Authentication token not found");
      throw new Error("Authentication token not found");
    }
    console.log("[WebRTCService] Token obtained successfully");

    const isDev = import.meta.env.VITE_DEBUG === "true";
    const apiBaseUrl = isDev
      ? "http://localhost:8000"
      : import.meta.env.VITE_BACKEND_ADDRESS?.replace(/\/api\/v1\/?$/, "") ||
        window.location.origin;

    const wsProtocol = apiBaseUrl.startsWith("https") ? "wss:" : "ws:";
    const wsHost = apiBaseUrl.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProtocol}//${wsHost}/ws/webrtc/${roomId}/?token=${token}`;
    console.log("[WebRTCService] WebSocket URL:", wsUrl);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[WebRTCService] WebSocket connected successfully");
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebRTCService] WebSocket message received:", data.type);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error(
            "[WebRTCService] Error parsing WebSocket message:",
            error
          );
        }
      };

      this.ws.onerror = (error) => {
        console.error("[WebRTCService] WebSocket error:", error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log("[WebRTCService] WebSocket disconnected:", {
          code: event.code,
          reason: event.reason,
        });
        this.cleanup();
      };
    });
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case "user_joined":
        if (this.onUserJoinedCallback) {
          this.onUserJoinedCallback(data.user_id, data.user_name);
        }
        if (this.isHost && this.localStream) {
          if (!this.peerConnections.has(data.user_id)) {
            console.log(
              `[WebRTCService] Creating offer for new participant: ${data.user_id}`
            );
            this.createOffer(data.user_id);
          } else {
            console.log(
              `[WebRTCService] Peer connection already exists for ${data.user_id}, skipping offer creation`
            );
          }
        }
        break;

      case "user_left":
        if (this.onUserLeftCallback) {
          this.onUserLeftCallback(data.user_id);
        }
        this.removeRemoteStream(data.user_id);
        break;

      case "offer":
        this.handleOffer(data.offer, data.sender_id);
        break;

      case "answer":
        this.handleAnswer(data.answer, data.sender_id);
        break;

      case "ice_candidate":
        this.handleIceCandidate(data.candidate, data.sender_id);
        break;

      case "stream_ended":
        if (this.onStreamEndedCallback) {
          this.onStreamEndedCallback();
        }
        this.cleanup();
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }

  async getAuthToken() {
    try {
      const token = await chatApi.getSocketToken();
      return token;
    } catch (error) {
      console.error("Error getting WebSocket token:", error);
      throw new Error("Failed to get authentication token");
    }
  }

  async startLocalStream(videoElement) {
    try {
      console.log("[WebRTCService] Requesting user media...");
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      console.log("[WebRTCService] Media stream obtained:", {
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length,
      });

      if (videoElement) {
        console.log("[WebRTCService] Attaching stream to video element");
        videoElement.srcObject = this.localStream;

        const playVideo = async () => {
          try {
            await videoElement.play();
            console.log("[WebRTCService] Video playing successfully");
          } catch (playError) {
            console.warn(
              "[WebRTCService] Auto-play prevented, user interaction required:",
              playError
            );
          }
        };

        await playVideo();

        videoElement.onloadedmetadata = () => {
          console.log("[WebRTCService] Video metadata loaded");
          playVideo();
        };
      } else {
        console.warn("[WebRTCService] No video element provided");
      }

      return this.localStream;
    } catch (error) {
      console.error("[WebRTCService] Error accessing media devices:", error);
      throw error;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  createPeerConnection(targetUserId) {
    if (this.peerConnections.has(targetUserId)) {
      this.peerConnections.get(targetUserId).close();
    }

    const pc = new RTCPeerConnection(this.getRTCConfiguration());
    this.peerConnections.set(targetUserId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStreams.set(targetUserId, remoteStream);
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream, targetUserId);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(event.candidate, targetUserId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUserId}:`, pc.connectionState);
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        this.removePeerConnection(targetUserId);
      }
    };

    return pc;
  }

  async createOffer(targetUserId) {
    try {
      if (this.peerConnections.has(targetUserId)) {
        console.log(
          `[WebRTCService] Peer connection already exists for ${targetUserId}, closing old one`
        );
        this.removePeerConnection(targetUserId);
      }

      const pc = this.createPeerConnection(targetUserId);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      this.ws.send(
        JSON.stringify({
          type: "offer",
          offer: offer,
          target_user_id: targetUserId,
        })
      );
      console.log(`[WebRTCService] Offer created and sent to ${targetUserId}`);
    } catch (error) {
      console.error(
        `[WebRTCService] Error creating offer for ${targetUserId}:`,
        error
      );
    }
  }

  async handleOffer(offer, senderId) {
    try {
      let pc = this.peerConnections.get(senderId);

      if (pc) {
        const currentState = pc.signalingState;
        console.log(
          `[WebRTCService] Existing peer connection to ${senderId}, state: ${currentState}`
        );

        if (currentState === "stable" || pc.remoteDescription) {
          console.log(
            `[WebRTCService] Closing existing connection to ${senderId} to handle new offer`
          );
          this.removePeerConnection(senderId);
          pc = null;
        }
      }

      if (!pc) {
        pc = this.createPeerConnection(senderId);
      }

      const state = pc.signalingState;
      if (state === "stable" || state === "have-local-offer") {
        console.log(
          `[WebRTCService] Cannot set remote offer, wrong state: ${state}`
        );
        this.removePeerConnection(senderId);
        pc = this.createPeerConnection(senderId);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.ws.send(
        JSON.stringify({
          type: "answer",
          answer: answer,
          target_user_id: senderId,
        })
      );
      console.log(`[WebRTCService] Answer created and sent to ${senderId}`);
    } catch (error) {
      console.error(
        `[WebRTCService] Error handling offer from ${senderId}:`,
        error
      );
      if (this.peerConnections.has(senderId)) {
        this.removePeerConnection(senderId);
      }
    }
  }

  async handleAnswer(answer, senderId) {
    try {
      const pc = this.peerConnections.get(senderId);
      if (!pc) {
        console.warn(
          `[WebRTCService] No peer connection found for ${senderId} when handling answer`
        );
        return;
      }

      const currentState = pc.signalingState;
      console.log(
        `[WebRTCService] Handling answer from ${senderId}, current signaling state: ${currentState}`
      );

      if (currentState === "have-local-offer" || currentState === "stable") {
        if (currentState === "stable" && pc.remoteDescription) {
          console.log(
            `[WebRTCService] Remote description already set for ${senderId}, ignoring duplicate answer`
          );
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(
          `[WebRTCService] Successfully set remote answer for ${senderId}`
        );
      } else {
        console.warn(
          `[WebRTCService] Cannot set remote answer for ${senderId}, wrong signaling state: ${currentState}`
        );
      }
    } catch (error) {
      console.error(
        `[WebRTCService] Error handling answer from ${senderId}:`,
        error
      );
      if (
        error.name === "InvalidStateError" ||
        error.message.includes("wrong state")
      ) {
        console.log(
          `[WebRTCService] Attempting to recover connection for ${senderId}`
        );
        this.removePeerConnection(senderId);
      }
    }
  }

  sendIceCandidate(candidate, targetUserId) {
    this.ws.send(
      JSON.stringify({
        type: "ice_candidate",
        candidate: candidate,
        target_user_id: targetUserId,
      })
    );
  }

  async handleIceCandidate(candidate, senderId) {
    try {
      const pc = this.peerConnections.get(senderId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  removeRemoteStream(userId) {
    this.remoteStreams.delete(userId);
  }

  removePeerConnection(userId) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.removeRemoteStream(userId);
  }
  async joinAsHost(roomId, videoElement) {
    console.log("[WebRTCService] Joining as host:", roomId);
    const userId = `host_${Date.now()}`;
    const userName = "Host";

    try {
      await this.connectWebSocket(roomId, userId, userName, true);
      console.log("[WebRTCService] WebSocket connected, starting local stream");
      await this.startLocalStream(videoElement);
      console.log("[WebRTCService] Successfully joined as host");
    } catch (error) {
      console.error("[WebRTCService] Error joining as host:", error);
      throw error;
    }
  }

  async joinAsParticipant(roomId, videoElement) {
    console.log("[WebRTCService] Joining as participant:", roomId);
    const userId = `participant_${Date.now()}`;
    const userName = "Participant";

    try {
      await this.connectWebSocket(roomId, userId, userName, false);
      console.log(
        "[WebRTCService] WebSocket connected, waiting for host stream"
      );

      if (!this.onRemoteStreamCallback && videoElement) {
        this.onRemoteStreamCallback = (stream, userId) => {
          console.log("[WebRTCService] Remote stream received from:", userId);
          if (videoElement && videoElement.srcObject !== stream) {
            videoElement.srcObject = stream;
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("[WebRTCService] Remote stream playing");
                })
                .catch((err) => {
                  if (err.name !== "AbortError") {
                    console.error(
                      "[WebRTCService] Error playing remote stream:",
                      err
                    );
                  }
                });
            }
          }
        };
      }
      console.log("[WebRTCService] Successfully joined as participant");
    } catch (error) {
      console.error("[WebRTCService] Error joining as participant:", error);
      throw error;
    }
  }

  async endStream() {
    if (this.isHost) {
      this.ws.send(
        JSON.stringify({
          type: "stream_ended",
        })
      );
    }
    this.cleanup();
  }

  cleanup() {
    console.log("[WebRTCService] Cleaning up resources");
    this.stopLocalStream();
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
      this.removeRemoteStream(userId);
    });
    this.peerConnections.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.remoteStreams.clear();
    this.onRemoteStreamCallback = null;
    this.onStreamEndedCallback = null;
    this.onUserJoinedCallback = null;
    this.onUserLeftCallback = null;
  }

  setOnRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  setOnStreamEnded(callback) {
    this.onStreamEndedCallback = callback;
  }

  setOnUserJoined(callback) {
    this.onUserJoinedCallback = callback;
  }

  setOnUserLeft(callback) {
    this.onUserLeftCallback = callback;
  }
}

export default new WebRTCService();
