import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';

import './main.css';

const Main = () => {

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
        navigate(`/room/${roomId}`);
    }

    return (
        <div ref={rootNode}>
            <h1>Available Rooms</h1>

            <button onClick={addRoom}>Create New Room</button>
        </div>
    )
}

export default Main