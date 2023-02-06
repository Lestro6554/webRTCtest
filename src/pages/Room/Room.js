import { useParams } from "react-router-dom"
import useWebRTC, { LOCAL_VIDEO } from "../../hooks/useWebRTC";

export default function Room() {

    const {id: roomID} = useParams(); //получение roomID из url 
    const {clients, provideoMediaRef} = useWebRTC(roomID);
    console.log(clients);

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