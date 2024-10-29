// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth')

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  };

// Registration Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({ msg: "User registered successfully", token });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ msg: "User registration failed" });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({ msg: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ msg: "User login failed" });
  }
});

router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ msg: "Welcome to the protected route" });
});

module.exports = router;
