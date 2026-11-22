
INSERT OR IGNORE INTO school_settings (id, name, short_name, tagline)
VALUES (1, "Pesantren Darul Rahman", "DARAH", "Mendidik Generasi Qur'ani");

INSERT OR IGNORE INTO users (id, username, full_name, password_hash, is_active, created_at, updated_at)
VALUES ("67061004-299a-434f-b7a9-6923e4e49e42", "superadmin", "Superadmin PTDARRAHMAN", "pbkdf2$120000$zWBgrS2YjI/dYkH5JmiWSQ==$GYPsm9rA5cwnoNI6zospyA24IzKgHEosRQZKvrB3uc4=", 1, 1795271519948, 1795271519948);

INSERT OR IGNORE INTO user_roles (id, user_id, role)
SELECT "a7dce362-5eaf-4dfd-89a6-576b83345084", id, "superadmin" FROM users WHERE username = "superadmin";

INSERT OR IGNORE INTO users (id, username, full_name, password_hash, is_active, created_at, updated_at)
VALUES ("f7ee2fe0-03a6-4b78-81cb-50ef18a4decb", "admin", "Administrator PTDARRAHMAN", "pbkdf2$120000$Rgy/2Or893t35Xoi3jzOAw==$PXT3eq9FBp3Sb9ipeGG/Yw+sqfHkkl05mQKcE80ivmQ=", 1, 1795271519948, 1795271519948);

INSERT OR IGNORE INTO user_roles (id, user_id, role)
SELECT "a08b788b-0e14-4ccd-bb76-94156d3f0d5b", id, "admin" FROM users WHERE username = "admin";
