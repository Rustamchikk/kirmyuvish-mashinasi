const pool = require('./database')

const initDatabase = async () => {
	try {
		// Foydalanuvchilar jadvali
		await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`)

		// UNIQUE constraint alohida qo'shamiz
		await pool.query(`
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'users_room_number_key'
    ) THEN
      ALTER TABLE users ADD CONSTRAINT users_room_number_key UNIQUE (room_number);
    END IF;
  END $$;
`)

		// Mashinalar jadvali
		await pool.query(`
      CREATE TABLE IF NOT EXISTS machines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

		// Bronlar jadvali
		await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        time_slot VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(machine_id, booking_date, time_slot)
      );
    `)

		// Haftalik cheklovlar jadvali
		await pool.query(`
      CREATE TABLE IF NOT EXISTS weekly_limits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        week_start DATE NOT NULL,
        bookings_count INTEGER DEFAULT 0,
        UNIQUE(user_id, week_start)
      );
    `)

		// Mashinalarni qo'shish
		const machineCount = await pool.query('SELECT COUNT(*) FROM machines')
		if (parseInt(machineCount.rows[0].count) === 0) {
			for (let i = 1; i <= 5; i++) {
				await pool.query('INSERT INTO machines (name) VALUES ($1)', [
					`Mashina ${i}`,
				])
			}
			console.log("5 ta mashina qo'shildi")
		}

		console.log('Database initialized successfully')
	} catch (error) {
		console.error('Database initialization error:', error)
	} finally {
		pool.end()
	}
}

initDatabase()
