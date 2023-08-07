import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// models 
import { User } from "./models/Users.js";

const app = express();
app.use(cors()); 
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


// registration -----------------------------------------------------------------------------------------------------------------------------

app.post("/register", async function(req, res) {

    const { email, name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        email: email,
        name: name,
        password: hashedPassword,
        todo: []
    });

    newUser.save()
    .then(savedUser => {
            // successfully saved
            console.log('User saved:', savedUser);
            //res.status(200).send('User registered successfully'); // Send a response indicating successful registration
            res.json(savedUser._id);
    })
    .catch(error => {
            // Error occurred while saving the user document
            console.error('Error saving user:', error);
            res.status(500).send('Error registering user'); // Send an error response
    });  

});

// check if user already exists
app.get("/checkEmail/:email", async function(req, res) {

    const { email } = req.params;

    const user = await User.findOne({ email });
    if(user) {
        res.json({exists: true})
    } else {
        res.json({exists: false});
    }
    
});

// login -----------------------------------------------------------------------------------------------------------------------------

app.post("/login", async function (req, res) {

    const { email, password } = req.body;
  
    try {
      // Find the user with the provided email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Use bcrypt to compare the provided password with the hashed password from the database
      const match = await bcrypt.compare(password, user.password);
  
      if (match) {
        const userId = user.id;
        res.json(userId); // Login successful
      } else {
        res.json(false); // Password doesn't match, login failed
      }
    } catch (error) {
      console.error("Error occurred during login:", error);
      res.status(500).json({ message: "An error occurred during login" });
    }
});

app.get("/users/:id", async function(req, res) {
    
    const { id } = req.params;

    try {
        const user = await User.findOne( {_id: id} );

        if(!user) {
            return res.status(404).json({error: "User not found"});
        }

        res.json(user);

    } catch (error) {
        console.error("Error occured while fetching a user: ", error);
        res.status(500).json({error: "Internal server error"});
    }

});

// add task

app.post(`/tasks/:id`, async function(req, res) {
    const { id } = req.params;
    const { task } = req.body;

    const taskObj = {
        userTask: task
    };

    const user = await User.findById(id);

    if(!user) {
        return res.status(404).json({message: "User not found"});
    }

    user.todo.push(taskObj);
    const savedUser = await user.save();

    res.status(200).json(savedUser);
});

// delete task

app.delete(`/tasks/delete/:userId/:taskId`, async function(req, res) {
    try {

        const { userId, taskId } = req.params;

        const user = await User.findById(userId);

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        await User.updateOne({ _id: userId }, { $pull: { todo: { _id: taskId } } });

    } catch(error) {
        console.error("Error occured while deleting a user: ", error);
        res.status(500).json({error: "Internal server error"});
    }

});
  


app.listen(3001, function() {
    console.log("server is listening on port 3001");
});