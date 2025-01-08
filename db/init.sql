CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(6, 2) NOT NULL
);
