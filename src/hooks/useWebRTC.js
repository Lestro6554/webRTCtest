import { useCallback, useEffect, useRef } from "react";
import useStateWithCallback from './useStateWithCallback';

export const LOCAL_VIDEO = 'LOCAL_VIDEO'

export default function useWebRTC(roomID, isConnected, stomp) {
    const [clients, updateClients] = useStateWithCallback([]);

    const addNewClient = useCallback((newClient, cb) => {
        if (!clients.includes(newClient)) {
            updateClients(item => [...item, newClient], cb);
        }
    }, [clients, updateClients]);

    const peerConnections = useRef({}); //хранение пиров для связки клиентов /-/ мутабельный
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null
    }); //ссылки на медиа элементы

    useEffect(() => {
        if (isConnected) {
            async function startCapture() {
                localMediaStream.current = await navigator.mediaDevices.getDisplayMedia({
                    audio: true,
                    video: {
                        cursor: 'always',
                        width: 1280,
                        height: 720
                    }
                });

                addNewClient(LOCAL_VIDEO, () => {
                    const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

                    if (localVideoElement) {
                        localVideoElement.volume = 0; //не слышать себя
                        localVideoElement.srcObject = localMediaStream.current;
                    }
                });
            }

            startCapture()
                .then(() => stomp.send("/app/room/a2e5f2b6-1440-47c5-b016-8825830e804e/join", {}, { room: roomID }))
                .catch(e => console.error("error userMedia: ", e));
        }

    }, [roomID, isConnected]);


    const provideoMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, [])

    return {
        clients,
        provideoMediaRef
    };
}