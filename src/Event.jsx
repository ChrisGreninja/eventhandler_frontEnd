import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useWebSocket from 'react-use-websocket';

function Event() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [attendeeCount, setAttendeeCount] = useState(0);
    const [attendees, setAttendees] = useState([]);
    const [showAttendees, setShowAttendees] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    const { sendMessage, lastMessage } = useWebSocket('wss://eventhandler-backend-sts7.onrender.com');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch event details
                const eventRes = await axios.get(`https://eventhandler-backend-sts7.onrender.com/events/${id}`, { withCredentials: true });
                if (eventRes.data.Error) {
                    alert(eventRes.data.Error);
                    navigate('/');
                } else {
                    setEvent(eventRes.data.event);
                    setAttendeeCount(eventRes.data.attendeeCount);
                    setHasJoined(eventRes.data.hasJoined);
                }

                // Check login status
                const userRes = await axios.get('https://eventhandler-backend-sts7.onrender.com/user', { withCredentials: true });
                setIsLoggedIn(!!userRes.data.name);
            } catch (err) {
                console.error('Error fetching data:', err);
                navigate('/');
                setIsLoggedIn(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data);
                if (data.type === 'updateAttendees' && data.eventId === id) {
                    setAttendeeCount(data.count);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        }
    }, [lastMessage, id]);

    const handleJoinEvent = async () => {
        if (!isLoggedIn) {
            alert('You must be logged in to join this event.');
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post(
                'https://eventhandler-backend-sts7.onrender.com/events/join',
                { eventId: id },
                { withCredentials: true }
            );
            
            if (response.data.Status === 'Successfully joined the event') {
                alert('Successfully joined the event!');
                setAttendeeCount(response.data.attendeeCount);
                setHasJoined(true);
            } else {
                alert(response.data.Error || 'Error joining event');
            }
        } catch (err) {
            console.error('Join event error:', err);
            alert(err.response?.data?.Error || 'Error joining event');
        }
    };

    const handleShowAttendees = async () => {
        try {
            const res = await axios.get(`https://eventhandler-backend-sts7.onrender.com/events/${id}/attendees`, { withCredentials: true });
            if (res.data.Error) {
                alert(res.data.Error);
            } else {
                setAttendees(res.data.attendees);
                setShowAttendees(true);
            }
        } catch (err) {
            console.error('Error fetching attendees:', err);
            alert('Error fetching attendee list');
        }
    };

    const handleCloseAttendees = () => {
        setShowAttendees(false);
    };

    if (!event) {
        return <div className="container py-5 text-center">Loading...</div>;
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8 col-md-10">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5">
                            <button
                                onClick={() => navigate('/')}
                                className="btn btn-outline-secondary mb-4"
                            >
                                ← Back to Events
                            </button>
                            <h1 className="card-title display-4 mb-4">{event.title}</h1>
                            <div className="mb-4">
                                <span className="badge bg-primary me-2">{event.category}</span>
                            </div>
                            <p className="lead mb-4">{event.description}</p>
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h5>Date & Time</h5>
                                    <p>
                                        {new Date(event.date).toLocaleDateString()} at {event.time}
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <h5>Location</h5>
                                    <p>{event.location}</p>
                                </div>
                            </div>
                            <div className="mb-4">
                                <h5>Created by</h5>
                                <p>{event.creator_name}</p>
                            </div>
                            <div className="mb-4">
                                <h5>Number of Attendees</h5>
                                <p>{attendeeCount}</p>
                                <button
                                    className="btn btn-outline-info"
                                    onClick={handleShowAttendees}
                                >
                                    View Attendees
                                </button>
                            </div>
                            {!hasJoined ? (
                                <button
                                    onClick={handleJoinEvent}
                                    className="btn btn-primary btn-lg w-100"
                                >
                                    Join Event
                                </button>
                            ) : (
                                <div className="alert alert-success text-center">
                                    You're attending this event!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showAttendees && (
                <div
                    className="modal"
                    style={{ display: 'block', background: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Attendees</h5>
                                <button className="btn-close" onClick={handleCloseAttendees}></button>
                            </div>
                            <div className="modal-body">
                                {attendees.length > 0 ? (
                                    <ul className="list-group">
                                        {attendees.map((attendee, index) => (
                                            <li key={index} className="list-group-item">
                                                {attendee.user_name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No attendees yet.</p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCloseAttendees}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Event;
