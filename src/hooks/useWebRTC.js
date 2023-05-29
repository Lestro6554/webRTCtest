import { useCallback, useRef, useEffect } from "react";

import useStateWithCallback from './useStateWithCallback';
import { useStomp } from "../../providers/StompClient";
import ACTIONS from '../providers/actions';

export const LOCAL_VIDEO = 'LOCAL_VIDEO';

export default function useWebRTC(roomID, uid) {

    const { stompClient } = useStomp();
    const [clients, updateClients] = useStateWithCallback([]);

    const addNewClient = useCallback((newClient, cb) => {
        updateClients(list => {
            if (!list.includes(newClient)) {
                return [...list, newClient]
            }

            return list;
        }, cb);
    }, [clients, updateClients]);

    const peerConnections = useRef({});
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null,
    });

    const sendToPeer = (eventType, payload) => {
        stompClient.publish({ destination: `/app/room/${roomID}/${eventType}`, body: JSON.stringify({ payload }) });
    }

    useEffect(() => {
        if (!stompClient.connected) {
            return new Promise((res, rej) => {
                if (!stompClient.active) {
                    stompClient.activate();
                    stompClient.onConnect = () => {
                        res();
                    }
                    console.log('stm activate', stompClient);
                }
            })
        }
    }, [roomID, stompClient])

    useEffect(() => {
        async function handleNewPeer({ peerID, createOffer }) {
            if (peerID in peerConnections.current) {
                return console.warn(`Already connected to peer ${peerID}`)
            }

            peerConnections.current[peerID] = new RTCPeerConnection(null)

            peerConnections.current[peerID].onicecandidate = (event) => {
                if (event.candidate) {
                    sendToPeer(ACTIONS.RELAY_ICE, {
                        peerID,
                        iceCandidate: event.candidate,
                    });
                }
            }

            let tracksNumber = 0;
            peerConnections.current[peerID].ontrack = ({ streams: [remoteStream] }) => {
                tracksNumber++

                if (tracksNumber === 1) { // video & audio tracks received
                    tracksNumber = 0;
                    addNewClient(peerID, () => {
                        if (peerMediaElements.current[peerID]) {
                            peerMediaElements.current[peerID].srcObject = remoteStream;
                        } else {
                            // FIX LONG RENDER IN CASE OF MANY CLIENTS
                            let settled = false;
                            const interval = setInterval(() => {
                                if (peerMediaElements.current[peerID]) {
                                    peerMediaElements.current[peerID].srcObject = remoteStream;
                                    settled = true;
                                }

                                if (settled) {
                                    clearInterval(interval);
                                }
                            }, 1000);
                        }
                    });
                }
            }

            localMediaStream.current.getTracks().forEach(track => {
                peerConnections.current[peerID].addTrack(track, localMediaStream.current);
            });

            if (createOffer) {
                const offer = await peerConnections.current[peerID].createOffer();

                await peerConnections.current[peerID].setLocalDescription(offer);

                sendToPeer(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: offer,
                });
            }
        }

        stompClient.subscribe(`/topic/${ACTIONS.ADD_PEER}`, handleNewPeer)

        return () => {
            stompClient.unsubscribe(`/topic/${ACTIONS.ADD_PEER}`);
        }
    }, []);

    useEffect(() => {
        async function setRemoteMedia({ peerID, sessionDescription: remoteDescription }) {
            await peerConnections.current[peerID]?.setRemoteDescription(
                new RTCSessionDescription(remoteDescription)
            );

            if (remoteDescription.type === 'offer') {
                const answer = await peerConnections.current[peerID].createAnswer();

                await peerConnections.current[peerID].setLocalDescription(answer);

                sendToPeer(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: answer,
                });
            }
        }

        stompClient.subscribe(`/topic/${ACTIONS.SESSION_DESCRIPTION}`, setRemoteMedia)

        return () => {
            stompClient.unsubscribe(`/topic/${ACTIONS.SESSION_DESCRIPTION}`);
        }
    }, []);

    useEffect(() => {
        stompClient.subscribe(`/topic/${ACTIONS.ICE_CANDIDATE}`, ({ peerID, iceCandidate }) => {
            peerConnections.current[peerID]?.addIceCandidate(
                new RTCIceCandidate(iceCandidate)
            );
        })

        return () => {
            stompClient.unsubscribe(`/topic/${ACTIONS.ICE_CANDIDATE}`);
        }
    }, []);

    useEffect(() => {
        const handleRemovePeer = ({ peerID }) => {
            if (peerConnections.current[peerID]) {
                peerConnections.current[peerID].close();
            }

            delete peerConnections.current[peerID];
            delete peerMediaElements.current[peerID];

            updateClients(list => list.filter(c => c !== peerID));
        };

        stompClient.subscribe(`/topic/${ACTIONS.REMOVE_PEER}`, handleRemovePeer)

        return () => {
            stompClient.unsubscribe(`/topic/${ACTIONS.REMOVE_PEER}`);
        }
    }, []);

    useEffect(() => {
        async function startCapture() {
            localMediaStream.current = await navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: {
                    width: 1280,
                    height: 720,
                }
            });

            addNewClient(LOCAL_VIDEO, () => {
                const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

                if (localVideoElement) {
                    localVideoElement.volume = 0;
                    localVideoElement.srcObject = localMediaStream.current;
                }
            });
        }

        startCapture()
            .then(() => sendToPeer(ACTIONS.JOIN, { room: roomID }))
            .catch(e => console.error('Error getting userMedia:', e));

        return () => {
            localMediaStream.current.getTracks().forEach(track => track.stop());

            sendToPeer(ACTIONS.LEAVE);
        };
    }, [roomID]);

    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, []);

    /* useEffect(() => {
        async function activateStomp() {
            if (!stompClient.connected) {
                return new Promise((res, rej) => {
                    if (!stompClient.active) {
                        stompClient.activate();
                        stompClient.onConnect = () => {
                            res();
                        }
                        console.log('stm activate', stompClient);
                    }
                })
            }
        }

        activateStomp()
            .then(() => {
                stompClient.subscribe(`/topic/room/${roomID}`, (message => {
                    if (message.body) {
                        console.log("got message with body", message.body);
                    } else {
                        console.log("got empty message");
                    }
                }));

                stompClient.subscribe(`/topic/room/${roomID}/sdp`, (message => {
                    if (message.body) {
                        const data = JSON.parse(message.body);
                        if (data.uid !== uid) {
                            console.log(data)
                            setRemoteMedia({ peerID: data.uid, remoteDescription: data.payload })
                                .then(() => {
                                    console.log('setRemoteMedia answer');
                                })
                                .catch(e => console.error("error setRemoteMedia answer: ", e));
                        }
                    } else {
                        console.log("got empty message");
                    }
                }));

                stompClient.subscribe(`/topic/room/${roomID}/candidate`, (message => {
                    if (message.body) {
                        const data = JSON.parse(message.body);
                        if (data.uid !== uid) {
                            peerConnections.current[uid].addIceCandidate(new RTCIceCandidate(data.payload.candidate))
                            console.log("got message with body candidate", data);
                        }
                    } else {
                        console.log("got empty message");
                    }
                }));
            })
            .catch(e => console.error("error connection stompJS: ", e));
    }, [roomID, stompClient])

    const [clients, updateClients] = useStateWithCallback([]);

    const addNewClient = useCallback((newClient, cb) => {
        updateClients(list => {
            if (!list.includes(newClient)) {
                return [...list, newClient]
            }

            return list;
        }, cb);
    }, [updateClients]);

    const peerConnections = useRef({}); //хранение пиров для связки клиентов /-/ мутабельный
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null
    }); //ссылки на медиа элементы

    const sendToPeer = (eventType, payload) => {
        stompClient.publish({ destination: `/app/room/${roomID}/${eventType}`, body: JSON.stringify({ payload, uid }) });
    }

    useEffect(() => {
        async function startCapture() {
            localMediaStream.current = await navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: {
                    width: 1280,
                    height: 720
                }
            });

            addNewClient(LOCAL_VIDEO, () => {
                const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

                if (localVideoElement) {
                    localVideoElement.volume = 0; //не слышать себя
                    localVideoElement.srcObject = localMediaStream.current;
                }
            });
        }

        startCapture()
            .then(() => {
                console.log('startCapture');
            })
            .then(() => {
                handleNewPeer({ peerID: uid, createOffer: true })
                    .then(() => {
                        console.log('handleNewPeer true');
                    })
                    .catch(e => console.error("error handleNewPeer true: ", e));
            })
            .catch(e => console.error("error userMedia: ", e));
    }, [uid])

    async function handleNewPeer({ peerID, createOffer }) {
        if (peerID in peerConnections.current) {
            return console.warn(`Already connected to peer ${peerID}`)
        }

        peerConnections.current[peerID] = new RTCPeerConnection(null)

        peerConnections.current[peerID].onicecandidate = async (event) => {
            if (event.candidate) {
                const candidate = event.candidate;
                console.log(candidate)
                sendToPeer('candidate', { candidate });
            }
        }

        let tracksNumber = 0;
        peerConnections.current[peerID].ontrack = ({ streams: [remoteStream] }) => {
            tracksNumber++

            if (tracksNumber === 1) { // video & audio tracks received
                tracksNumber = 0;
                addNewClient(peerID, () => {
                    if (peerMediaElements.current[peerID]) {
                        peerMediaElements.current[peerID].srcObject = remoteStream;
                    } else {
                        let settled = false;
                        const interval = setInterval(() => {
                            if (peerMediaElements.current[peerID]) {
                                peerMediaElements.current[peerID].srcObject = remoteStream;
                                settled = true;
                            }

                            if (settled) {
                                clearInterval(interval);
                            }
                        }, 1000);
                    }
                });
            }
        }

        if (localMediaStream.current) {
            localMediaStream.current.getTracks().forEach(track => {
                peerConnections.current[peerID].addTrack(track, localMediaStream.current);
            });
        }

        if (createOffer) {
            const offer = await peerConnections.current[peerID].createOffer();

            await peerConnections.current[peerID].setLocalDescription(offer);

            sendToPeer('sdp', offer);
        }

        console.log(peerConnections.current[peerID]);
        console.log(localMediaStream);
        console.log(peerMediaElements);
    }

    async function setRemoteMedia({ peerID, remoteDescription }) {

        await peerConnections.current[uid].setRemoteDescription(
            new RTCSessionDescription(remoteDescription)
        );

        if (remoteDescription.type === 'offer') {
            const answer = await peerConnections.current[uid].createAnswer();
            await peerConnections.current[uid].setLocalDescription(answer);
            sendToPeer('sdp', answer);
        } else if (remoteDescription.type === 'answer') {
            sendToPeer('sdp', peerConnections.current[uid].localDescription);
        }
    }

    const stop = () => {
        //localMediaStream.current.getTracks().forEach(track => track.stop());
        updateClients([]);
    }

    const btnWebRTC = function () {
        return (
            <>
                {/* clients.length === 0 ? <button onClick={start}>start</button> : <button onClick={stop}>stop</button> }
            </>
        )
    }

    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, []) */

    return {
        clients,
        provideMediaRef,
    };
}