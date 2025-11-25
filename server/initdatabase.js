// server/initdatabase.js - YANGILANGAN VERSIYA (POOL NI YOPMASLIK)
const pool = require('./config/database')

const initDatabase = async () => {
    let connection;
    try {
        console.log('🚀 Database initialization started...')

        // ✅ YANGI: Alohida connection ochamiz
        connection = await pool.connect();

        // Foydalanuvchilar jadvali (haftalik tozalanadigan)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                room_number VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `)

        // ✅ YANGILANGAN: Usersadmin jadvali (BRON MA'LUMOTLARI BILAN)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS usersadmin (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                room_number VARCHAR(10) NOT NULL,
                user_id INTEGER REFERENCES users(id), -- ✅ YANGI: user_id qo'shildi
                machine_name VARCHAR(50), -- ✅ YANGI: Mashina nomi
                booking_date DATE, -- ✅ YANGI: Bron sanasi
                time_slot VARCHAR(20), -- ✅ YANGI: Vaqt oralig'i
                booking_created_at TIMESTAMP, -- ✅ YANGI: Bron qilgan vaqti
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(room_number) -- Bir xonada faqat bitta foydalanuvchi bo'ladi
            );
        `)

        // ✅ YANGI: Admin login attempts jadvali
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_login_attempts (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                attempt_count INTEGER DEFAULT 1,
                last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_locked BOOLEAN DEFAULT FALSE,
                locked_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `)

        // ✅ YANGI: Agar usersadmin jadvali mavjud bo'lsa, yangi ustunlarni qo'shamiz
        await connection.query(`
            DO $$ 
            BEGIN 
                -- user_id ustunini qo'shish
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'usersadmin' AND column_name = 'user_id'
                ) THEN
                    ALTER TABLE usersadmin ADD COLUMN user_id INTEGER REFERENCES users(id);
                END IF;
                
                -- machine_name ustunini qo'shish
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'usersadmin' AND column_name = 'machine_name'
                ) THEN
                    ALTER TABLE usersadmin ADD COLUMN machine_name VARCHAR(50);
                END IF;
                
                -- booking_date ustunini qo'shish
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'usersadmin' AND column_name = 'booking_date'
                ) THEN
                    ALTER TABLE usersadmin ADD COLUMN booking_date DATE;
                END IF;
                
                -- time_slot ustunini qo'shish
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'usersadmin' AND column_name = 'time_slot'
                ) THEN
                    ALTER TABLE usersadmin ADD COLUMN time_slot VARCHAR(20);
                END IF;
                
                -- booking_created_at ustunini qo'shish
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'usersadmin' AND column_name = 'booking_created_at'
                ) THEN
                    ALTER TABLE usersadmin ADD COLUMN booking_created_at TIMESTAMP;
                END IF;
            END $$;
        `)

        // ✅ ESKI UNIQUE CONSTRAINTNI OLIB TASHLAYMIZ (agar mavjud bo'lsa)
        await connection.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'users_name_room_unique'
                ) THEN
                    ALTER TABLE users DROP CONSTRAINT users_name_room_unique;
                END IF;
            END $$;
        `)

        // ✅ YANGI UNIQUE CONSTRAINT - FAQAT XONA RAQAMI UNIQUE
        await connection.query(`
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

        // Haftalik limitlar jadvali
        await connection.query(`
            CREATE TABLE IF NOT EXISTS weekly_limits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                week_start DATE NOT NULL,
                bookings_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `)

        // ✅ YANGI: Admin sessions jadvali
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_sessions (
                id SERIAL PRIMARY KEY,
                admin_username VARCHAR(100) NOT NULL,
                session_data JSONB NOT NULL,
                device_info JSONB,
                ip_address VARCHAR(45),
                is_active BOOLEAN DEFAULT TRUE,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `)

        // ✅ YANGI: Indexlar yaratish
        console.log('📊 Indexlar yaratilmoqda...')
        
        // Admin login attempts uchun indexlar
        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_attempts_user_ip 
            ON admin_login_attempts(username, ip_address);
        `)

        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_attempts_locked 
            ON admin_login_attempts(locked_until) WHERE is_locked = TRUE;
        `)

        // Admin sessions uchun indexlar
        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_sessions_username 
            ON admin_sessions(admin_username);
        `)

        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_sessions_active 
            ON admin_sessions(is_active) WHERE is_active = TRUE;
        `)

        // Usersadmin uchun indexlar
        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_usersadmin_room 
            ON usersadmin(room_number);
        `)

        await connection.query(`
            CREATE INDEX IF NOT EXISTS idx_usersadmin_booking_date 
            ON usersadmin(booking_date);
        `)

        console.log('✅ Database initialized successfully!')
        console.log('🎯 users - Haftalik tozalanadigan foydalanuvchilar')
        console.log('📊 usersadmin - TO\'LIQ ARXIV (foydalanuvchi + bron ma\'lumotlari)')
        console.log('🔐 admin_login_attempts - 4 urinish + 4 daqiqa blokirovka')
        console.log('💻 admin_sessions - Admin session monitoring')
        console.log('🔒 Har xonada faqat BIRINCHI ro\'yxatdan o\'tgan foydalanuvchi')
        console.log('📈 Barcha jadvallar uchun indexlar yaratildi')
        
    } catch (error) {
        console.error('❌ Database initialization error:', error)
        throw error; // Xatoni yuqoriga otkazamiz
    } finally {
        // ✅ YANGI: Faqat connection ni yopamiz, pool ni emas
        if (connection) {
            connection.release();
            console.log('🔗 Database connection released (pool active)')
        }
    }
}

// Faqat direkt ishga tushirilganda bajarilsin
if (require.main === module) {
    initDatabase()
}

module.exports = initDatabase