const express = require("express")
const app = express()

const port = 3000

app.use(express.json())

const pool = require("./db.config")

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.post("/register", async (req, res) => {
  const { username, password } = req.body
  let message = {}

  try {
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ])

    // User already exists
    if (user.rows.length > 0) {
      message = {
        message: "User already exists",
        success: false,
      }
      return res.json(message)
    } else {
      //Register new user
      const newUser = await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
        [username, password]
      )

      // Create new session
      session = await pool.query(
        "INSERT INTO sessions (user_id) VALUES ($1) RETURNING *",
        [newUser.rows[0].id]
      )
      console.log(session.rows[0])
      const message = {
        message: "Register successful",
        token: session.rows[0].token,
        success: true,
      }
      return res.json(message)
    }
  } catch (err) {
    throw err
  }
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body
  let message = {}

  try {
    const users = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    )

    // user found
    if (users.rows.length > 0) {
      // checking already logged in
      let session = await pool.query(
        "SELECT * FROM sessions WHERE user_id = $1",
        [users.rows[0].id]
      )
      if (session.rows.length > 0) {
        // Update session updated_at
        await pool.query(
          "UPDATE sessions SET updated_at = $1 WHERE token = $2",
          [new Date(), session.rows[0].token]
        )

        let message = {
          message: "Login successful",
          token: session.rows[0].token,
          success: true,
        }
        return res.json(message)
      }

      session = await pool.query(
        "INSERT INTO sessions (user_id) VALUES ($1) RETURNING *",
        [users.rows[0].id]
      )
      console.log(session.rows[0])
      const message = {
        message: "Login successful",
        token: session.rows[0].token,
        success: true,
      }
      return res.json(message)
    } else {
      return res.status(400).send("User not found")
    }
  } catch (err) {
    throw err
  }
})

app.post("/logout", async (req, res) => {
  const { username, password, token } = req.body

  try {
    const session = await pool.query(
      "SELECT * FROM sessions                                          WHERE token = $1",
      [token]
    )
    if (session.rows.length > 0) {
      await pool.query("DELETE FROM sessions WHERE token = $1", [token])

      return res.json({ message: "Logout successful", success: true })
    }

    return res.status(400).send("Nothing to do")
  } catch (err) {
    throw err
  }
})

app.post("/authorize", async (req, res) => {
  const { token } = req.body

  try {
    const session = await pool.query(
      "SELECT *  FROM sessions WHERE token = $1",
      [token]
    )
    if (session.rows.length > 0) {
      const user = await pool.query(
        "SELECT * FROM users                                            WHERE id = $1",
        [session.rows[0].user_id]
      )

      // Session created expired
      if (
        session.rows[0].created_at < new Date(new Date().getTime() - 60 * 1000)
      ) {
        await pool.query("DELETE FROM sessions WHERE token = $1", [
          session.rows[0].token,
        ])
        let message = {
          message: "Session expired",
          success: false,
        }
        return res.json(message)
      }

      // Session updated expired
      if (
        session.rows[0].updated_at < new Date(new Date().getTime() - 30 * 1000)
      ) {
        await pool.query("DELETE FROM sessions WHERE token = $1", [
          session.rows[0].token,
        ])
        let message = {
          message: "Session expired",
          success: false,
        }
        return res.json(message)
      }

      if (user.rows.length > 0) {
        // Update session updated_at
        await pool.query(
          "UPDATE sessions SET updated_at = $1 WHERE token = $2",
          [new Date(), token]
        )

        const message = {
          message: "Authorized",
          success: true,
          username: user.rows[0].username,
        }
        return res.json(message)
      }
    } else {
      const message = {
        message: "Not authorized",
        success: false,
      }

      return res.json(message)
    }
  } catch (err) {
    throw err
  }
})

app.get("/users", async (req, res) => {
  try {
    const users = await pool.query("SELECT * FROM users")
    return res.json(users.rows)
  } catch (err) {
    throw err
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
