<div align="center">
  <img 
    src="https://github.com/nezuuuuuuu/VIBRO/blob/main/src/assets/images/readme_vibrologo.png" 
    alt="Vibro Logo" 
    width="100%" height="auto" 
    style="border-radius: 15px; max-width: 100%; height: auto;" 
  />
</div>



<p align="center">
   Welcome to <strong>VIBRO</strong> — an AI-powered mobile app designed to support deaf and hard-of-hearing individuals in their everyday life.
</p>

---

VIBRO identifies and monitors **important environmental sounds in real time**, helping users stay aware and safe wherever they are. 

The app alerts users through **visual cues, haptic feedback, and on-screen notifications**, ensuring accessibility across different needs. Users can also **train custom sound models** to recognize personalized sounds, use built-in communication tools, and enable **trusted contacts to remotely monitor surrounding sounds** for added safety. 

VIBRO aims to make daily environments more understandable, responsive, and inclusive through intelligent sound recognition.


---

## 🛠️ Tech Stack and Dependencies

This project is a full-stack application built on the **MERN stack principle**. The **frontend** is a mobile app built with **React Native** and styled using **NativeWind CSS**. The **backend** is a RESTful API powered by **Node.js** and **Express**, using **MongoDB** for persistence.

### 📱 Frontend (Mobile App)

| Technology | Version | Description |
| :--- | :--- | :--- |
| **React Native** | **0.79.0** | Core framework for cross-platform mobile development. |
| **React** | **19.0.0** | JavaScript library for building user interfaces. |
| **TypeScript** | **5.0.4** | Adds strong typing to JavaScript. |
| **NativeWind CSS** | **4.1.23** | Styling using **Tailwind CSS** principles in React Native. |
| **React Navigation** | **7.1.6** | Handles routing and screen navigation. |
| **Zustand** | **5.0.3** | Fast and scalable state management solution. |
| **Axios** | **1.9.0** | Promise-based HTTP client for API communication. |
| **Socket.IO Client** | **4.8.1** | Enables real-time, bidirectional communication (crucial for VIBRO). 

### 🖥️ Backend (API Server)

| Technology | Version | Description |
| :--- | :--- | :--- |
| **Node.js** | **>=18** | JavaScript runtime environment. |
| **Express** | *5.1.0* | Minimalist web framework for Node.js. |
| **Mongoose** | *8.14.1* | Primary NoSQL database for flexible data storage. |
| **Nodemailer** | **7.0.11** | Used for sending emails (e.g., verification, password resets). |

---

## ⚙️ Deployment and Setup Instructions

This guide assumes you have **Node.js** (v20+), **npm/Yarn**, and the necessary **React Native environment** (Android Studio/Xcode) installed.

### 1. Prerequisites

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### 2. Backend Setup

1.  **Clone the Repository:**
    ```sh
    git https://github.com/jeecoo/mern_vibro.git
    ```
2.  **Navigate to Backend Directory:**
    ```sh
    cd mern_vibro # (or whatever your frontend folder is named)
    ```
3.  **Install Dependencies:**
    ```sh
    # Using npm
    npm install
    ```
4.  **Database Setup:**
    * Ensure your **MongoDB** database server is running.
5.  **Environment Variables:**
    * Create a file named `.env` in the `mern_vibro` directory.
    * Add the necessary configurations (e.g., database connection string, JWT secret).
    ```env
    # Example .env content
    ```
7.  **Start the Backend Server:**
    ```sh
    # Using npm
    npm run dev

    # OR using Yarn
    yarn dev
    ```
    The server should now be running on `http://localhost:3000`.

### 3. Frontend Setup and Deployment

1.  **Clone the Repository:**
    ```sh
    git https://github.com/nezuuuuuuu/VIBRO.git
    ```
2.  **Navigate to Frontend Directory:**
    ```sh
    cd ../frontend # (or whatever your frontend folder is named)
    ```
2.  **Install Dependencies:**
    ```sh
    # Using npm
    npm install
    ```
3.  **Configure API URL:**
    * Open your configuration file (e.g., `src/store/api.js`).
    * Ensure the BASE_URL` points to your running backend server:
        ```typescript
        const BASE_URL = "http://3.106.248.74:3000/api";
        ```

4.  **Start Metro (JavaScript Bundler):**
    Open a new terminal window/pane and run:
    ```sh
    # Using npm
    npm start
    ```

5.  **Build and Run Your App (in a separate terminal):**

    #### **Android**
    ```sh
    # Using npm
    npm run android
    ```

If everything is set up correctly, you should see your new app running in the Android Emulator or your connected device.

---

## 🔑 Sample User Credentials

These credentials are for testing and demonstration purposes only.

| User Type | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Standard User** | `jeecoocoocoo@gmail.com` | `123456` | All features |

---

## Congratulations! :tada:

You've successfully run the VIBRO app! :partying_face:
