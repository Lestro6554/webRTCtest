import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';

import { useStomp } from '../../providers/StompClient';

import './main.css';

const Main = () => {

    const { stompClient } = useStomp();
    const navigate = useNavigate();
    const [rooms, updateRooms] = useState([]);
    const [roomId, setRoomId] = useState('a2e5f2b6-1440-47c5-b016-8825830e804e');
    const rootNode = useRef();

    /*
    useEffect(() => {
        todo получение списка комнат
        socket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] } = {}) => {
            if (rootNode.current) {
                updateRooms(rooms);
            }
        });
    }, []);
    */
    const addRoom = () => {
        stompClient.connect({}, onConnected, onError);
        navigate(`/room/${roomId}`);
    }

    const joinRoom = () => {
        navigate(`/room/${roomId}`);
    }

    const onConnected = () => {
        stompClient.subscribe(`/topic/room/${roomId}`);
        console.log('connected');
    }

    const onError = (err) => {
        console.log(err.headers.message);
    }

    /*

    const [userData, setUserData] = useState({
        username: 'lohname',
        connected: false,
        message: 'qwerty'
    });

    useEffect(() => {
        //todo получение комнат updaterooms
    }, [])

    const connect = () => {
        let Sock = new SockJS('http://localhost:8081/ws'); //connect websocket
        stompClient = over(Sock); //подключение stomp через sockjs connect /-/ далее используется API stomp
        stompClient.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        setUserData({ ...userData, "connected": true });
        stompClient.subscribe('/topic/room/a2e5f2b6-1440-47c5-b016-8825830e804e', onMessageReceived);
        userJoin();
        console.log('Connected')
    }

    const onError = (err) => {
        console.log(err.headers.message);
    }

    const userJoin = () => {
        let userJoin = {
            senderName: userData.username,
            status: ACTIONS.JOIN
        };
        stompClient.send("/app/room/a2e5f2b6-1440-47c5-b016-8825830e804e/join", {}, JSON.stringify(userJoin));
        console.log('send data')
    }

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

    const sendValue = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: "MESSAGE"
            };
            console.log(chatMessage);
            stompClient.send("/app/room/a2e5f2b6-1440-47c5-b016-8825830e804e/join", {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, "message": "zxcghoul" });
        }
    }
    */
    return (
        <div ref={rootNode}>
            <h1>Available Rooms</h1>

            <ul>
                {rooms.map(roomID => (
                    <li key={roomID}>
                        {roomID}
                        <button onClick={joinRoom}>JOIN ROOM</button>
                    </li>
                ))}
            </ul>

            <button onClick={addRoom}>Create New Room</button>
        </div>
    )
}

export default Main