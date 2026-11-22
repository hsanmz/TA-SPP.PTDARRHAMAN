
INSERT OR IGNORE INTO school_settings (id, name, short_name, tagline)
VALUES (1, "Pesantren Darul Rahman", "DARAH", "Mendidik Generasi Qur'ani");

INSERT OR IGNORE INTO users (id, username, full_name, password_hash, is_active, created_at, updated_at)
VALUES ("67061004-299a-434f-b7a9-6923e4e49e42", "superadmin", "Superadmin PTDARRAHMAN", "pbkdf2$100000$jz1/smwU0xDh6z03lu0rpA==$J2oaTp1LrO5q6abb3iW3CnwMKR/OwvbXV0EmkZfecd0=", 1, 1795271519948, 1795271519948);

INSERT OR IGNORE INTO user_roles (id, user_id, role)
SELECT "a7dce362-5eaf-4dfd-89a6-576b83345084", id, "superadmin" FROM users WHERE username = "superadmin";

INSERT OR IGNORE INTO users (id, username, full_name, password_hash, is_active, created_at, updated_at)
VALUES ("f7ee2fe0-03a6-4b78-81cb-50ef18a4decb", "admin", "Administrator PTDARRAHMAN", "pbkdf2$100000$GCJm77o+ciMvV9RcGPWx8g==$+izc54d0SE4NgSYOdRCP1myYGIpG9+TbgN4xMTeFIGQ=", 1, 1795271519948, 1795271519948);

INSERT OR IGNORE INTO user_roles (id, user_id, role)
SELECT "a08b788b-0e14-4ccd-bb76-94156d3f0d5b", id, "admin" FROM users WHERE username = "admin";
