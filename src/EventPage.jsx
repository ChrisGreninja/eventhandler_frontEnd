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
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

       // WebSocket connection
       const { sendMessage, lastMessage } = useWebSocket('ws://localhost:8081');

    useEffect(() => {
        // Fetch events
        axios.get('http://localhost:8081/events', { withCredentials: true })
            .then(res => {
                setEvents(res.data || []);
            })
            .catch(err => {
                console.log(err);
                setEvents([]);
                navigate('/login');
            });

        // Fetch attendee counts
        axios.get('http://localhost:8081/events/attendees', { withCredentials: true })
            .then(res => {
                if (!res.data.Error) {
                    setAttendees(res.data);
                }
            })
            .catch(err => {
                console.error('Error fetching attendee counts:', err);
            });

        // Fetch user data
        axios.get('http://localhost:8081/user', { withCredentials: true })
            .then(res => {
                if (res.data.name) {
                    setUserName(res.data.name);
                    setIsLoggedIn(true);
                    setIsGuest(res.data.name === 'Guest');
                }
            })
            .catch(err => {
                console.log(err);
                setIsLoggedIn(false);
                navigate('/login');
            });
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

    const handleEventSubmit = (e) => {
        e.preventDefault();

        if (!isLoggedIn || isGuest) {
            alert('You must be logged in with a regular account to create an event.');
            navigate('/login');
            return;
        }

        axios.post('http://localhost:8081/events/create', newEvent, { withCredentials: true })
            .then(res => {
                if (res.data.Status === 'Event created successfully!') {
                    alert('Event Created Successfully');
                    // Refresh events list after creation
                    axios.get('http://localhost:8081/events', { withCredentials: true })
                        .then(response => {
                            setEvents(response.data || []);
                        })
                        .catch(error => {
                            console.error('Error fetching updated events:', error);
                            setEvents([]);
                        });
                    
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
            })
            .catch(err => {
                console.error('Error creating event:', err);
                alert(err.response?.data?.Error || 'Error creating event');
            });
    };

    const handleJoinEvent = (eventId) => {
        if (!isLoggedIn) {
            alert('You must be logged in to join this event.');
            navigate('/login');
            return;
        }

        axios.post('http://localhost:8081/events/join', 
            { eventId },
            { withCredentials: true }
        )
        .then(response => {
            if (response.data.Status === "Successfully joined the event") {
                alert('Successfully joined the event!');
                setAttendees(prev => ({
                    ...prev,
                    [eventId]: response.data.attendeeCount
                }));
            } else {
                alert(response.data.Error || 'Error joining event');
            }
        })
        .catch(err => {
            console.error('Join event error:', err);
            if (err.response?.data?.Error) {
                alert(err.response.data.Error);
            } else {
                alert('Error joining event. Please try again.');
            }
        });
    };

    const handleLogout = () => {
        axios.post('http://localhost:8081/logout', {}, { withCredentials: true })
            .then(res => {
                if (res.data.Status === 'Logged out successfully') {
                    setIsLoggedIn(false);
                    setUserName('');
                    navigate('/login');
                }
            })
            .catch(err => {
                console.error('Logout error:', err);
                alert('An error occurred while logging out.');
            });
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
                        <div key={event.id} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                            <div className="card shadow-sm border-0 rounded">
                                <div className="card-body">
                                    <h5 className="card-title">{event.title}</h5>
                                    <p className="card-text">{event.description.substring(0, 100)}...</p>
                                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {event.time}</p>
                                    <p><strong>Location:</strong> {event.location}</p>
                                    <p><strong>Category:</strong> {event.category}</p>
                                    <p>
                                        <strong>Attendees:</strong> {attendees[event.id] || 0}
                                    </p>
                                    <button
                                        onClick={() => navigate(`/event/${event._id}`)}
                                        className="btn btn-primary w-100"
                                    >
                                        View Details
                                    </button>
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