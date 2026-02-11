const pool = require("../../db");

// GET all events
exports.getAllEvents = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        EXISTS (
          SELECT 1
          FROM users_events ue
          WHERE ue.event_id = e.event_id
          AND ue.user_id = $1
        ) AS is_registered
      FROM events e
      ORDER BY e.event_date ASC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
};


// GET my events
exports.getMyEvents = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        TRUE AS is_registered
      FROM events e
      WHERE e.owner_id = $1
      ORDER BY e.event_date ASC
    `, [userId]);

    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch my events" });
  }
};

// POST create an event
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      location,
      max_subscribers,
      category,
      image_url,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events
      (title, description, event_date, location, owner_id, nb_subscribers, max_subscribers, category, image_url)
      VALUES ($1,$2,$3,$4,$5,1,$6,$7,$8)
      RETURNING *`,
      [title, description||null, event_date||null, location||null, req.user.id, max_subscribers, category || 'Autres', image_url||null]
    );

    const event = result.rows[0];

    await pool.query(
      "INSERT INTO users_events (user_id, event_id) VALUES ($1, $2)",
      [req.user.id, event.event_id]
    );

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
};

// Delete an event (only by owner)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérify the owner of the event
    const check = await pool.query(
      "SELECT * FROM events WHERE event_id = $1 AND owner_id = $2",
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Event not found or not owner" });
    }

    // delete subscriptions
    await pool.query(
      "DELETE FROM users_events WHERE event_id = $1",
      [id]
    );

    // delete event
    await pool.query(
      "DELETE FROM events WHERE event_id = $1",
      [id]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error(" deleteEvent error:", error);
    return res.status(500).json({ error: "Failed to delete event" });
  }
};

//subscribe to an event
exports.subscribeEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;

  // Check if event is full or user already subscribed
  try {
    const event = await pool.query(
      "SELECT nb_subscribers, max_subscribers FROM events WHERE event_id = $1",
      [eventId]
    );
    // console.log(" event =", event.rows[0]);
    if (event.rows[0].nb_subscribers >= event.rows[0].max_subscribers) {
      return res.status(400).json({ error: "Event is full" });
    }
    // Check if already subscribed
    const exists = await pool.query(
      "SELECT 1 FROM users_events WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    // console.log(" exists =", exists);
    if (exists.rowCount > 0) {
      return res.status(400).json({ error: "Already subscribed" });
    }
    // Subscribe user to event
    await pool.query(
      "INSERT INTO users_events (user_id, event_id) VALUES ($1, $2)",
      [userId, eventId]
    );
    // Increment subscriber count
    await pool.query(
      "UPDATE events SET nb_subscribers = nb_subscribers + 1 WHERE event_id = $1",
      [eventId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Subscription failed" });
  }
};

//unsubscribe from an event
exports.unsubscribeEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;
  // Check if user is subscribed
  try {
    const result = await pool.query(
      "DELETE FROM users_events WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Not subscribed" });
    }

    await pool.query(
      "UPDATE events SET nb_subscribers = GREATEST(nb_subscribers - 1, 0) WHERE event_id = $1",
      [eventId]
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Unsubscribe failed" });
  }
};

// Update an event (only by owner)
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    event_date,
    location,
    max_subscribers,
    category,
    image_url,
  } = req.body;

  const userId = req.user.id;

  try {
    const check = await pool.query(
      "SELECT 1 FROM events WHERE event_id = $1 AND owner_id = $2",
      [id, userId]
    );

    if (check.rowCount === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const result = await pool.query(`
      UPDATE events
      SET title = $1,
          description = $2,
          event_date = $3,
          location = $4,
          max_subscribers = $5,
          category = $6,
          image_url = $7
      WHERE event_id = $8
      RETURNING *
    `, [title, description, event_date, location, max_subscribers, category, image_url, id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update event" });
  }
};

exports.getEventSubscribers = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;

  try {
    const check = await pool.query("SELECT owner_id FROM events WHERE event_id = $1", [eventId]);
    if (check.rowCount === 0) return res.status(404).json({ error: "Event not found" });
    if (check.rows[0].owner_id !== userId) return res.status(403).json({ error: "Not authorized" });

    const result = await pool.query(`
      SELECT u.id, u.username
      FROM users u
      JOIN users_events ue ON ue.user_id = u.id
      WHERE ue.event_id = $1
      ORDER BY u.username ASC
    `, [eventId]);

    res.json(result.rows);
  } catch (err) {
    console.error("getEventSubscribers error:", err);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
};

exports.duplicateEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;

  try {
    const eventCheck = await pool.query(
      "SELECT * FROM events WHERE event_id = $1 AND owner_id = $2",
      [eventId, userId]
    );

    if (eventCheck.rowCount === 0) {
      return res.status(404).json({ error: "Event not found or not authorized" });
    }

    const originalEvent = eventCheck.rows[0];

    const result = await pool.query(
      `INSERT INTO events
      (title, description, event_date, location, owner_id, nb_subscribers, max_subscribers, category, image_url)
      VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8)
      RETURNING *`,
      [
        `${originalEvent.title} (Copie)`,
        originalEvent.description,
        originalEvent.event_date,
        originalEvent.location,
        userId,
        originalEvent.max_subscribers,
        originalEvent.category,
        originalEvent.image_url
      ]
    );

    const newEvent = result.rows[0];

    await pool.query(
      "INSERT INTO users_events (user_id, event_id) VALUES ($1, $2)",
      [userId, newEvent.event_id]
    );

    res.status(201).json(newEvent);
  } catch (err) {
    console.error("duplicateEvent error:", err);
    res.status(500).json({ error: "Failed to duplicate event" });
  }
};