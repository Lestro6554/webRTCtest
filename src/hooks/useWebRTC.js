import { useCallback, useEffect, useRef } from "react";

import { useStomp } from "../providers/StompClient";
import useStateWithCallback from './useStateWithCallback';

export const LOCAL_VIDEO = 'LOCAL_VIDEO';


export default function useWebRTC(roomID) {

    const { stompClient } = useStomp();
    const [clients, updateClients] = useStateWithCallback([]);

    const addNewClient = useCallback((newClient, cb) => {
        updateClients(list => {
            if (!list.includes(newClient)) {
                return [...list, newClient]
            }

            return list;
        }, cb);
    }, [clients, updateClients]);

    const peerConnections = useRef({}); //хранение пиров для связки клиентов /-/ мутабельный
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null
    }); //ссылки на медиа элементы


    useEffect(() => {

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
            .then(() => {
                stompClient.send(`/topic/room/${roomID}/join`, {}, { room: roomID });
            })
            .catch(e => console.error("error userMedia: ", e));

    }, [roomID]);


    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, [])

    return {
        clients,
        provideMediaRef
    };
}