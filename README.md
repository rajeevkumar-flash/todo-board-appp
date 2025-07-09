# 👁️ Collaborative To-Do Board (MERN + Socket.IO)

A real-time collaborative Kanban board that allows team members to create, assign, drag-drop, and manage tasks live — with smart task assignment and intelligent conflict handling.

## 🌐 Live Demo

**🔗 App:** https://todo-board-appp.vercel.app
**🎥 Demo Video:** [Watch here](https://drive.google.com/file/d/186pfMRAW8UwBr08-ERo7lm7Q0nciq29v/view?usp=drive_link

---

## 🚀 Tech Stack

| Layer     | Tech                           |
| --------- | ------------------------------ |
| Frontend  | React, Tailwind CSS, React DnD |
| Backend   | Node.js, Express.js            |
| Database  | MongoDB + Mongoose             |
| Real-time | Socket.IO                      |
| Auth      | JWT + LocalStorage             |

---

## 🔧 Setup & Installation

### 1. Clone the Repo

```bash
https://github.com/rajeevkumar-flash/todo-board-appp

cd todo-board-app
```

### 2. Install Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm start
```

### 3. Install Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file:

```
REACT_APP_BACKEND_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm start
```

---

## ✨ Features

- 🢑 JWT-based authentication (Register/Login)
- 📂 Drag & Drop Kanban board (Todo, In Progress, Done)
- 🔄 Real-time updates via Socket.IO
- 🧠 **Smart Assign** to distribute workload evenly
- ⚔️ **Conflict Handling** with overwrite or merge options
- 📝 Activity log of recent user actions
- 📱 Responsive UI and smooth animations

---

## 🤖 Smart Assign Logic

When you click the **"Smart Assign"** button on a task:

1. The backend runs a query to count how many active (not Done) tasks each user has.
2. It finds the user with the **least active tasks**.
3. The task is then **automatically assigned** to that user.
4. An action log entry is created and all clients receive the update in real-time.

✅ This promotes fair task distribution and reduces manual effort.

---

## ⚔️ Conflict Handling Logic

When two users try to update the same task simultaneously:

1. The app compares the task's `version` and `lastModifiedAt` timestamps.
2. If a conflict is detected:
   - The client is notified.
   - A modal prompts the user to **Overwrite** or **Merge** changes.
3. Based on the choice, a fresh PUT request is sent with the resolved data.

✅ This ensures task data integrity and collaboration safety.

---

## 📁 Folder Structure

```
/frontend  → React app
/backend   → Express + MongoDB + Socket.IO
```

---

## 📌 Important Commands

| Action           | Command                     |
| ---------------- | --------------------------- |
| Start backend    | `npm start` (in `backend`)  |
| Start frontend   | `npm start` (in `frontend`) |
| Kill server port | `npx kill-port 5000`        |

---

## 📜 License

MIT License © 2025 rajeev kumar

