DROP TABLE books CASCADE;
DROP TABLE book_covers CASCADE;


CREATE TABLE books (
	id SERIAL PRIMARY KEY,
	review_title VARCHAR(100),
	review TEXT,
	rating FLOAT,
	date TIMESTAMP
);
CREATE TABLE book_covers (
	id INTEGER REFERENCES books(id)UNIQUE,
	author_name TEXT,
	book_title TEXT,
	author_cover TEXT,
	book_cover TEXT
);
