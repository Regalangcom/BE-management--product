// userController.js

const userModel = require("../models/userModel");

exports.register = (req, res) => {
    const { email, password, isAdmin, name, lastname } = req.body;
    console.log("log" , req.body);
    
    // Validate request body
    if (!email || !password || !name || !lastname) {
        return res.status(400).json({ 
            error: "All fields are required" 
        });
    }

    userModel.register(email, password, isAdmin, name, lastname)
        .then(result => {
            console.log("Successful Register");
            res.json(result);
        })
        .catch(err => {
            console.error("Registration error:", err.message);
            if (err.message === "User already exists") {
                res.status(409).json({ error: err.message });
            } else {
                res.status(500).json({ error: "Error registering user" });
            }
        });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    userModel.login(email, password)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err.message);
            res.status(500).send("Error logging in.");
        });
};
