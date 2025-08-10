import React from "react";
import SlideForm from "./pages/SlideForm.jsx";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Calender from "./pages/Calender";
import Books from "./pages/Books";
import Home from "./pages/Home";
import Landing from "./pages/Landing.jsx";
import SetupPage from "./pages/Setup.jsx";
import ClassroomPage from "./pages/ClassroomPage.jsx";
import { ProfileProvider } from "./components/common/ProfileContext.jsx";
import MeetingRoomWrapper from "./pages/MeetingRoomWrapper.jsx";
function App() {
    return (
        <ProfileProvider>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<SlideForm />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/dashboard/" element={<Dashboard />}>
                    <Route index element={<Home />} />
                    <Route path="classroom" element={<Home />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="calendar" element={<Calender />} />
                    <Route path="books" element={<Books />} />
                    <Route path="classroom/:id" element={<ClassroomPage />} />
                </Route>
                <Route
                    path="/meeting/:roomId"
                    element={<MeetingRoomWrapper />}
                />
            </Routes>
        </ProfileProvider>
    );
}

export default App;
