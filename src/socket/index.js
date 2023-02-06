import { over } from 'stompjs';
import SockJS from 'sockjs-client';

const options = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"]
}

let stompClient = null;
let Sock = new SockJS('http://localhost:8081/ws', options); //connect websocket

stompClient = over(Sock); //подключение stomp через sockjs connect /-/ далее используется API stomp

export default stompClient;