import React, { useEffect, useState } from "react";  // Import React hooks
import axios from "axios";  // Import Axios for making HTTP requests

function App() {
  // State variables to store users, name input, and email input
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Fetch users from the Flask backend when the component loads
  useEffect(() => {
    axios.get("http://127.0.0.1:5000/users")  // Send GET request to Flask API
      .then(response => setUsers(response.data))  // Store received users in state
      .catch(error => console.error("Error fetching users:", error));  // Handle errors
  }, []);  // Empty dependency array means this runs only once when the component mounts

  // Function to add a new user to the database
  const addUser = () => {
    axios.post("http://127.0.0.1:5000/users", { name, email })  // Send POST request to add user
      .then(response => setUsers([...users, response.data]))  // Update state with the new user
      .catch(error => console.error("Error adding user:", error));  // Handle errors
  };

  return (
    <div>
      <h1>Flask + React + MySQL</h1>

      {/* Form to Add a New User */}
      <h2>Add User</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}  // Update name state on input change
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}  // Update email state on input change
      />
      <button onClick={addUser}>Add User</button>  {/* Call addUser() when button is clicked */}

      {/* Display List of Users */}
      <h2>Users List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} ({user.email})</li>  // Render each user in a list
        ))}
      </ul>
    </div>
  );
}

export default App;  // Export component so it can be used in index.js
