
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultUsers } from './utils/initializeUsers.ts'
import { getUsers } from './utils/storageManager.ts'

// Initialize application
const init = () => {
  // Check if we have any users, if not initialize default users
    const users = getUsers();
    if (users.length === 0) {
    console.log("No users found, initializing default users...");
    initializeDefaultUsers();
  } else {
    console.log(`Found ${users.length} existing users`);
  }
  
  // Render the application
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  } else {
    console.error("Root element not found");
  }
};

// Start the application
init();
