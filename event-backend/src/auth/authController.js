const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.login = async (req, res) => {
    const { username, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM users WHERE username=$1",
        [username]
    );

    const user = result.rows[0];

    if (!user) {
        console.log("pas d'utilisateur")
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        console.log("mot de passe incorrect!")
        return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("🧪 JWT_SECRET (sign) =", JWT_SECRET);

    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return res.json({ token });
};


exports.me= async (req, res)=>{
    return res.json({
        user: {
            id:req.user.id,
            username:req.user.username,
        },
    });
};


exports.signup = async (req, res) => {
    const { username, password } = req.body;
    // Vérifier si l'utilisateur existe déjà
    const result = await pool.query(
        "SELECT id FROM users WHERE username=$1",
        [username]
    );

    if (result.rows.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
    }

    //Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur
    const newUser = await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
        [username, hashedPassword]
    );

    const user = newUser.rows[0];

    // Générer le token
    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return res.status(201).json({
        message: "User created",
        token,
    });
};
