import React from 'react';

import { over } from 'stompjs';
import SockJS from 'sockjs-client';

const StompContext = React.createContext(null);

export const useStomp = () => {
    return React.useContext(StompContext);
};

export const StompProvider = (props) => {
    console.log('stm start')
    const options = {
        reconnectionAttempts: "Infinity",
        timeout: 10000,
        transports: ["websocket"]
    };

    const sock = new SockJS('http://localhost:8081/ws', options);
    const stompClient = over(sock);

    return (
        <StompContext.Provider value={{ stompClient }}>
            {props.children}
        </StompContext.Provider>
    )
}