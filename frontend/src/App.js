import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppContent from './components/AppContent';

const App = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};

export default App;