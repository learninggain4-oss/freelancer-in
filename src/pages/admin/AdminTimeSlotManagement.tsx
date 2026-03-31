import React, { useState } from 'react';

const AdminTimeSlotManagement = () => {
    const [timeSlots, setTimeSlots] = useState([]);

    const addTimeSlot = (newSlot) => {
        setTimeSlots([...timeSlots, newSlot]);
    };

    const removeTimeSlot = (slotToRemove) => {
        setTimeSlots(timeSlots.filter(slot => slot !== slotToRemove));
    };

    return (
        <div>
            <h1>Admin Time Slot Management</h1>
            <ul>
                {timeSlots.map((slot, index) => (
                    <li key={index}>
                        {slot} <button onClick={() => removeTimeSlot(slot)}>Remove</button>
                    </li>
                ))}
            </ul>
            <button onClick={() => addTimeSlot(prompt('Enter a new time slot:'))}>Add Time Slot</button>
        </div>
    );
};

export default AdminTimeSlotManagement;
