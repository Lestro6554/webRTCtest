import React, { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const StompContext = React.createContext(null);

export const useStomp = () => {
    return React.useContext(StompContext);
};


export const StompProvider = (props) => {

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stompClient = new Client({
        brokerURL: 'ws://localhost:8081/ws',
        debug: function (str) {
            console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    stompClient.webSocketFactory = () => {
        const options = {
            reconnectionAttempts: "Infinity",
            timeout: 10000,
            transports: ["websocket"]
        };
    
        return new SockJS('http://localhost:8081/ws', options);
    }
/*
    useEffect(() => {
        if(!stompClient.active) {
            stompClient.activate();
            console.log('stm activate')
        }
    }, [stompClient])
*/
    return (
        <StompContext.Provider value={{ stompClient }}>
            {props.children}
        </StompContext.Provider>
    )
}