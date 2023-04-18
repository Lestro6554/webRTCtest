import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import { useStomp } from "../../providers/StompClient";
//import useWebRTC, { LOCAL_VIDEO } from "../../hooks/useWebRTC";


// eslint-disable-next-line no-restricted-globals
const uid = self.crypto.randomUUID()
console.log(uid);

export default function Room() {

    const { id: roomID } = useParams(); //получение roomID из url
    //const { clients, provideMediaRef } = useWebRTC(roomID);

    const { stompClient } = useStomp();

    const localVideoRef = useRef();
    const remotelVideoRef = useRef();
    const pc = useRef({});
    const textRef = useRef();
    //const sdpRef = useRef();
    //const candidateRef = useRef([]);

    useEffect(() => {

        //todo: https://github.com/stomp-js/rx-stomp
        async function activateStomp() {
            if (!stompClient.connected) {
                return new Promise((res, rej) => {
                    if (!stompClient.active) {
                        stompClient.activate();
                        stompClient.onConnect = () => {
                            res();
                        }
                        console.log('stm activate')
                    }
                })
            }
        }

        activateStomp()
            .then(() => {
                stompClient.subscribe(`/topic/room/${roomID}`, (message => {
                    if (message.body) {
                        textRef.current.value = message.body
                        console.log("got message with body", textRef.current.value);
                    } else {
                        console.log("got empty message");
                    }
                }));
                stompClient.subscribe(`/topic/room/${roomID}/sdp`, (message => {
                    if (message.body) {
                        const data = JSON.parse(message.body);
                        if (data.uid !== uid) {
                            pc.current.setRemoteDescription(new RTCSessionDescription(data.payload.sdp));
                            textRef.current.value = message.body;
                            console.log("got message with body sdp", data.payload.sdp);
                        }
                    } else {
                        console.log("got empty message");
                    }
                }));
                stompClient.subscribe(`/topic/room/${roomID}/candidate`, (message => {
                    if (message.body) {
                        const data = JSON.parse(message.body);
                        if (data.uid !== uid) {
                            pc.current.addIceCandidate(new RTCIceCandidate(data.candidate))
                            console.log("got message with body candidate", data.candidate);
                        }
                    } else {
                        console.log("got empty message");
                    }
                }));
            })
            .catch(e => console.error("error connection stompJS: ", e));
    }, [roomID, stompClient])

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
            console.log(e.candidate)
            if (e.candidate) {
                console.log(e.candidate)
                const candidate = e.candidate
                stompClient.publish({ destination: `/app/room/${roomID}/candidate`, body: JSON.stringify({ candidate, uid }) });
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
        console.log(pc.current)
    }

    const sendToPeer = (eventType, payload) => {
        stompClient.publish({ destination: `/app/room/${roomID}/${eventType}`, body: JSON.stringify({ payload, uid }) });
    }

    const processSDP = (sdp) => {
        console.log(JSON.stringify({ sdp }))
        pc.current.setLocalDescription(sdp)

        sendToPeer('sdp', { sdp });
    }

    const createOffer = () => {
        pc.current.createOffer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        }).then(sdp => {

            //send offer sdp to offering peer
            processSDP(sdp);
        }).catch(err => console.log(err))
    }

    const createAnswer = () => {
        pc.current.createAnswer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        }).then(sdp => {

            //send asnwer sdp to offering peer
            processSDP(sdp);
        }).catch(err => console.log(err))
    }

    /*     const setRemoteDescription = () => {
            const sdp = JSON.parse(textRef.current.value)
            console.log(sdp)

            pc.current.setRemoteDescription(new RTCSessionDescription(sdp.sdp))
        } */

    /*const addCandidate = () => {
        /* const candidate = JSON.parse(messageRef.current.value)
        console.log(candidate)

        candidateRef.current.forEach(candidate => {
            console.log(candidate);
            pc.current.addIceCandidate(new RTCIceCandidate(candidate))
        })
    } */

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
            </div>
        </div>
    )
}