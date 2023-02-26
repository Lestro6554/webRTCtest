import { over } from 'stompjs';
import SockJS from 'sockjs-client';

export default function stompClient() {
    const options = {
        reconnectionAttempts: "Infinity",
        timeout: 10000,
        transports: ["websocket"]
    }
    
    let Sock = new SockJS('http://localhost:8081/ws', options); //connect websocket
    
    let stompClient = over(Sock); //подключение stomp через sockjs connect /-/ далее используется API stomp
    return stompClient
}