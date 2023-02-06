import { useCallback, useEffect, useRef, useState } from "react";
import useStateWithCallback from './useStateWithCallback';
import stompClient from '../socket';

export const LOCAL_VIDEO = 'LOCAL_VIDEO'

export default function useWebRTC(roomID) {

    const [clients, updateClients] = useStateWithCallback([]);

    const addNewClient = useCallback((newClient, cb) => {
        if (!clients.includes(newClient)) {
            updateClients(item => [...item, newClient], cb);
        }
    }, [clients, updateClients]);

    const [isConnected, setIsConnected] = useState(false);

    const peerConnections = useRef({}); //хранение пиров для связки клиентов /-/ мутабельный
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null
    }); //ссылки на медиа элементы

    useEffect(() => {
        connect();
        console.log(isConnected)
        if (isConnected) {
            async function startCapture() {
                localMediaStream.current = await navigator.getDisplayMedia({
                    audio: true,
                    video: {
                        cursor: 'always',
                        width: 1280,
                        height: 720
                    }
                });

                addNewClient(LOCAL_VIDEO, () => {
                    const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

                    if(localVideoElement) {
                        localVideoElement.volume = 0; //не слышать себя
                        localVideoElement.srcObject = localMediaStream.current;
                    }
                });
            }

            startCapture()
                .then(() => stompClient.send("/app/room/a2e5f2b6-1440-47c5-b016-8825830e804e/join", {}, { room: roomID }))
                .catch(e => console.error("error userMedia: ", e));
        }

    }, [roomID, isConnected]);

    const connect = () => {
        stompClient.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        stompClient.subscribe('/topic/room/a2e5f2b6-1440-47c5-b016-8825830e804e', onMessageReceived);
        setIsConnected(true)
        console.log('Connected')
    }

    //вызывается каждый раз при получении сообщения
    const onMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload.body);
        switch (payloadData.status) {
            case "JOIN":
                console.log('JOIN')
                break;
            case "MESSAGE":
                console.log('MESSAGE')
                break;
        }
    }

    const onError = (err) => {
        console.log(err.headers.message);
    }

    const provideoMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, [])

    return {
        clients,
        provideoMediaRef
    };
}