import { useRef } from "react";
import { useParams } from "react-router-dom";
//import useWebRTC, { LOCAL_VIDEO } from "../../hooks/useWebRTC";

export default function Room() {

    //const { id: roomID } = useParams(); //получение roomID из url 
    //const { clients, provideMediaRef } = useWebRTC(roomID);

    const localVideoRef = useRef();
    const remotelVideoRef = useRef();
    const pc = useRef(new RTCPeerConnection(null));
    const textRef = useRef();

    const getUserMedia = () => {
        const options = {
            audio: false,
            video: {
                cursor: 'always',
                width: 640,
                height: 480
            }
        }

        navigator.mediaDevices.getDisplayMedia(options)
            .then(stream => {

                localVideoRef.current.srcObject = stream

                stream.getTracks().forEach(track => {
                    _pc.addTrack(track, stream)
                })
            })
            .catch(err => {
                console.log(err);
            })

        const _pc = new RTCPeerConnection(null);

        _pc.onicecandidate = (e) => {
            if (e.candidate) {
                console.log(JSON.stringify(e.candidate))
            }
        }

        _pc.onconnectionstatechange = (e) => {
            console.log(e)
        }
        
        _pc.ontrack = (e) => {
            //получение удаленного стрима
            remotelVideoRef.current.srcObject = e.streams[0]
        }

        pc.current = _pc
    }

    const createOffer = () => {
        pc.current.createOffer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        }).then(sdp => {
            console.log(JSON.stringify(sdp))
            pc.current.setLocalDescription(sdp)
        }).catch(err => console.log(err))
    }

    const createAnswer = () => {
        pc.current.createAnswer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        }).then(sdp => {
            console.log(JSON.stringify(sdp))
            pc.current.setLocalDescription(sdp)
        }).catch(err => console.log(err))
    }

    const setRemoteDescription = () => {
        const sdp = JSON.parse(textRef.current.value)
        console.log(sdp)

        pc.current.setRemoteDescription(new RTCSessionDescription(sdp))
    }

    const addCandidate = () => {
        const candidate = JSON.parse(textRef.current.value)
        console.log(candidate)

        pc.current.addIceCandidate(new RTCIceCandidate(candidate))
    }

    return (
        <div style={{ margin: 10 }}>
            <button onClick={() => getUserMedia()}>Screen sharing</button>
            <div>
                <video ref={localVideoRef} autoPlay></video>
                <video ref={remotelVideoRef} autoPlay></video>
            </div>
            <div>
                <button onClick={createOffer}>create offer</button>
                <button onClick={createAnswer}>create answer</button>
                <br />
                    <textarea ref={textRef}></textarea>
                <br />
                <button onClick={setRemoteDescription}>Set remote description</button>
                <button onClick={addCandidate}>Add candidates</button>
            </div>
        </div>
    )
}