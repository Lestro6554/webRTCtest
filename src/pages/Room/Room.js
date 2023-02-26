import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import useWebRTC, { LOCAL_VIDEO } from "../../hooks/useWebRTC";

import stompClient from '../../socket';

export default function Room() {
    let stomp = stompClient();
    const { id: roomID } = useParams(); //получение roomID из url 
    const [isConnected, setIsConnected] = useState(false);
    const { clients, provideoMediaRef } = useWebRTC(roomID, isConnected, stomp);
    console.log(clients);

    useEffect(() => {
        connect();
        console.log('room start', roomID)
    }, [])

    const connect = () => {
        stomp.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        stomp.subscribe('/topic/room/a2e5f2b6-1440-47c5-b016-8825830e804e', onMessageReceived);
        setIsConnected(true)
        console.log('Connected')
    }

    const onError = (err) => {
        console.log(err.headers.message);
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

    return (
        <div>
            {clients.map((clientID) => {
                return (
                    <div key={clientID}>
                        <video
                            ref={inst => {
                                provideoMediaRef(clientID, inst);
                            }}
                            autoPlay
                            playsInline
                            muted={clientID === LOCAL_VIDEO}
                        />
                    </div>
                )
            })}
        </div>
    )
}