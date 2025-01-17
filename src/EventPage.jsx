import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import useWebSocket from 'react-use-websocket';

function EventPage() {
    const [events, setEvents] = useState([]);
    const [attendees, setAttendees] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isGuest, setIsGuest] = useState(false); 
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();
    const { sendMessage, lastMessage } = useWebSocket('wss://eventhandler-backend-sts7.onrender.com');

    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: '',
        imageUrl: '',
        isForLoggedInOnly: false,
    });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
            try {
                // First check authentication
                const userRes = await axios.get('https://eventhandler-backend-sts7.onrender.com/user', { withCredentials: true });
                if (!userRes.data.name) {
                    navigate('/login');
                    return;
                }

                setUserName(userRes.data.name);
                setIsLoggedIn(true);
                setIsGuest(userRes.data.name === 'Guest');

                // Then fetch events
                const eventsRes = await axios.get('https://eventhandler-backend-sts7.onrender.com/events', { withCredentials: true });
                setEvents(eventsRes.data || []);
                
                // Fetch attendee counts
                for (const event of eventsRes.data) {
                    try {
                        const eventRes = await axios.get(`https://eventhandler-backend-sts7.onrender.com/events/${event._id}`, { withCredentials: true });
                        if (!eventRes.data.Error) {
                            setAttendees(prev => ({
                                ...prev,
                                [event._id]: eventRes.data.attendeeCount
                            }));
                        }
                    } catch (err) {
                        console.error('Error fetching event details:', err);
                    }
                }
            } catch (err) {
                console.log('Auth check error:', err);
                navigate('/login');
            }
        };

        checkAuthAndFetchData();
    }, [navigate]);

    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data);
                if (data.type === 'updateAttendees') {
                    setAttendees(prev => ({
                        ...prev,
                        [data.eventId]: data.count
                    }));
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        }
    }, [lastMessage]);

    const handleEventChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewEvent(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();

        if (!isLoggedIn || isGuest) {
            alert('You must be logged in with a regular account to create an event.');
            navigate('/login');
            return;
        }

        try {
            const res = await axios.post('https://eventhandler-backend-sts7.onrender.com/events/create', newEvent, { withCredentials: true });
            if (res.data.Status === 'Event created successfully!') {
                alert('Event Created Successfully');
                // Refresh events list after creation
                try {
                    const response = await axios.get('https://eventhandler-backend-sts7.onrender.com/events', { withCredentials: true });
                    setEvents(response.data || []);
                } catch (error) {
                    console.error('Error fetching updated events:', error);
                    setEvents([]);
                }
                
                setNewEvent({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    location: '',
                    category: '',
                    imageUrl: '',
                    isForLoggedInOnly: false,
                });
                setShowForm(false);
            } else {
                alert(res.data.Error || 'Error creating event');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            alert(err.response?.data?.Error || 'Error creating event');
        }
    };

    const handleJoinEvent = async (eventId) => {
        if (!isLoggedIn) {
            alert('You must be logged in to join this event.');
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post('https://eventhandler-backend-sts7.onrender.com/events/join', 
                { eventId },
                { withCredentials: true }
            );
            
            if (response.data.Status === "Successfully joined the event") {
                alert('Successfully joined the event!');
                setAttendees(prev => ({
                    ...prev,
                    [eventId]: response.data.attendeeCount
                }));
            } else {
                alert(response.data.Error || 'Error joining event');
            }
        } catch (err) {
            console.error('Join event error:', err);
            if (err.response?.data?.Error) {
                alert(err.response.data.Error);
            } else {
                alert('Error joining event. Please try again.');
            }
        }
    };

    const handleLogout = async () => {
        try {
            const res = await axios.post('https://eventhandler-backend-sts7.onrender.com/logout', {}, { withCredentials: true });
            if (res.data.Status === 'Logged out successfully') {
                setIsLoggedIn(false);
                setUserName('');
                navigate('/login');
            }
        } catch (err) {
            console.error('Logout error:', err);
            alert('An error occurred while logging out.');
        }
    };

    const toggleForm = () => {
        if (!isLoggedIn || isGuest) {
            alert('You must be logged in with a regular account to create events.');
            navigate('/login');
            return;
        }
        setShowForm(prevState => !prevState);
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                {isLoggedIn && !isGuest && (
                    <button onClick={toggleForm} className="btn btn-primary">
                        {showForm ? 'Hide Create Event Form' : 'Create New Event'}
                    </button>
                )}

                <Dropdown>
                    <Dropdown.Toggle variant="secondary" id="dropdown-user" className="rounded-pill px-3 py-2">
                        {userName || 'Guest'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {isLoggedIn ? (
                            <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                        ) : (
                            <Dropdown.Item onClick={() => navigate('/login')}>Login</Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>

            {showForm && !isGuest && (
                <>
                    <h3 className="text-center text-secondary mb-4">Create New Event</h3>
                    <div className="row justify-content-center">
                        <div className="col-lg-6 col-md-8 col-sm-12">
                            <form onSubmit={handleEventSubmit} className="bg-light p-4 rounded shadow-sm">
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label"><strong>Event Title</strong></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={newEvent.title}
                                        onChange={handleEventChange}
                                        required
                                        placeholder="Enter event title"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label"><strong>Event Description</strong></label>
                                    <textarea
                                        className="form-control"
                                        name="description"
                                        value={newEvent.description}
                                        onChange={handleEventChange}
                                        required
                                        placeholder="Describe the event"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="date" className="form-label"><strong>Event Date</strong></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="date"
                                        value={newEvent.date}
                                        onChange={handleEventChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="time" className="form-label"><strong>Event Time</strong></label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        name="time"
                                        value={newEvent.time}
                                        onChange={handleEventChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="location" className="form-label"><strong>Event Location</strong></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="location"
                                        value={newEvent.location}
                                        onChange={handleEventChange}
                                        required
                                        placeholder="Enter event location"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="category" className="form-label"><strong>Event Category</strong></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="category"
                                        value={newEvent.category}
                                        onChange={handleEventChange}
                                        required
                                        placeholder="Enter event category"
                                    />
                                </div>
                                <div className="mb-3 form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="isForLoggedInOnly"
                                        checked={newEvent.isForLoggedInOnly}
                                        onChange={handleEventChange}
                                    />
                                    <label className="form-check-label" htmlFor="isForLoggedInOnly">
                                        <strong>Restrict event to logged-in users only</strong>
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary w-100">Create Event</button>
                            </form>
                        </div>
                    </div>
                </>
            )}

            <h2 className="text-center text-primary mb-4">Upcoming Events</h2>
            <div className="row mb-4">
                {(!events || events.length === 0) ? (
                    <div className="col-12 text-center">
                        <h4>No events available.</h4>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event._id} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                            <div className="card shadow-sm border-0 rounded">
                                <div className="card-body">
                                    <h5 className="card-title">{event.title}</h5>
                                    <p className="card-text">{event.description.substring(0, 100)}...</p>
                                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {event.time}</p>
                                    <p><strong>Location:</strong> {event.location}</p>
                                    <p><strong>Category:</strong> {event.category}</p>
                                    <p><strong>Attendees:</strong> {attendees[event._id] || 0}</p>
                                    <div className="d-flex gap-2">
                                        <button
                                            onClick={() => navigate(`/event/${event._id}`)}
                                            className="btn btn-primary flex-grow-1"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default EventPage;
