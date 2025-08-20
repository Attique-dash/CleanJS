const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");

const usersFile = path.join(__dirname, "../data/users.json");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({ username, email, password });
    await user.save();

    await sendMail(email, username);

    return res.json({ msg: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    res.json({ msg: "Login successful", user });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const syncUsers = async () => {
  const data = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  for (let user of data) {
    const exists = await User.findOne({ email: user.email });
    if (!exists) {
      let newUser = new User(user);
      await newUser.save();
      await sendMail(user.email, user.username);
      console.log(` Synced: ${user.username}`);
    }
  }
};

module.exports = { registerUser, loginUser, syncUsers };
