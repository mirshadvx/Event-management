import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { v4 as uuidv4 } from 'uuid';

const APP_ID = Number(import.meta.env.VITE_ZegoCloud_APP_ID)
const SERVER_SECRET = import.meta.env.VITE_ZegoCloud_SERVER_ID

const generateKitToken = (roomID, userID, userName) => {
    return ZegoUIKitPrebuilt.generateKitTokenForTest(
        APP_ID,
        SERVER_SECRET,
        roomID,
        userID,
        userName
    );
};

const createZegoInstance = (kitToken) => {
    return ZegoUIKitPrebuilt.create(kitToken);
};

const joinRoomAsHost = (zegoInstance, container, roomID) => {
    zegoInstance.joinRoom({
        container: container,
        scenario: {
            mode: ZegoUIKitPrebuilt.LiveStreaming,
            config: {
                role: ZegoUIKitPrebuilt.Host,
            },
        },
        sharedLinks: [{
            name: 'Live Stream Link',
            url: `${window.location.origin}/live/${roomID}`,
        }],
        showScreenSharingButton: true,
        showTextChat: true,
        showRoomTimer: true,
    });
};

const joinRoomAsAudience = (zegoInstance, container) => {
    zegoInstance.joinRoom({
        container: container,
        scenario: {
            mode: ZegoUIKitPrebuilt.LiveStreaming,
            config: {
                role: ZegoUIKitPrebuilt.Audience,
            },
        },
        showTextChat: true,
        showRoomTimer: true,
    });
};

const destroyZegoInstance = (zegoInstance) => {
    if (zegoInstance) {
        zegoInstance.destroy();
    }
};

export {
    generateKitToken,
    createZegoInstance,
    joinRoomAsHost,
    joinRoomAsAudience,
    destroyZegoInstance
};
