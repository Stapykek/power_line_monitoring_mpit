// client/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom'; // ← ВНИМАНИЕ: НЕ Router!
import MainPage from './pages/MainPage';
import AnalyzePage from './pages/AnalyzePage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
        </Routes>
    );
}

export default App;