import { Fragment } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./Components/layouts/Landing";
import Navbar from "./Components/layouts/Navbar";
import Login from "./Components/auth/Login";
import Register from "./Components/auth/Register";

const App = () => (
  <Router>
    <Fragment>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Routes>
    </Fragment>
  </Router>
);

export default App;
