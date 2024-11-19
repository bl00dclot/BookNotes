import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import axios from "axios";
import morgan from "morgan";
import pg from "pg";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));

    // Connect database

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "booknotes",
    password: "5432",
    port: 5432,
});

db.connect();
        /// Array for all book review posts

let books = [];

        // Get all book reviews

app.get("/", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM books JOIN book_covers ON books.id = book_covers.id ORDER BY date DESC"
        );
        books = result.rows;
        res.render("index.ejs", {allBooks: books});
    } catch (err) {
        console.error(err.message);
    }
});

app.post("/sort", async (req, res) => {

    const sortTitle = req.body.sortTitle;
    const sortRating = req.body.sortRating;
    const sortDate = req.body.sortDate;

    // Build the ORDER BY clause based on input
    let orderByClauses = [];
    if (sortTitle) orderByClauses.push(`title ${sortTitle}`);
    if (sortRating) orderByClauses.push(`rating ${sortRating}`);
    if (sortDate) orderByClauses.push(`date ${sortDate}`);

    // Join the clauses into a single string
    const orderBy = orderByClauses.length > 0 ? `ORDER BY ${orderByClauses.join(', ')}` : '';

    // Execute the query with dynamic ORDER BY
    const result = await db.query(`SELECT * FROM books ${orderBy}`);
    books = result.rows;
    res.render("index.ejs", { allBooks: books });
});

        // Get route for posting and editing book reviews

app.get("/bookreview", (req, res) => {
    res.render("bookreview.ejs")
});

        // Post route for deleting book reviews from db

app.post("/delete", async (req, res) => {
    console.log(req.body.deleteBook);
    try {
        await db.query("DELETE FROM books WHERE id = ($1)", [req.body.deleteBook])
        res.redirect("/");
    } catch (err) {
        console.error(err.message);
    }
});

        // Declare empty variable to store book review ID

let updateBookID;

        // Post route for selecting a book review 

app.post("/edit", async (req, res) => {
    updateBookID = req.body.updateBook;
    console.log(updateBookID);

    try {

        const result = await db.query("SELECT * FROM books WHERE id = $1",[updateBookID]);
        const bookReview = result.rows[0];
        res.render("bookreview.ejs", {
            bookTitle: bookReview.title, 
            bookRating: bookReview.rating, 
            bookReview: bookReview.review,
        });
    
    } catch (err) {
        console.error(err.message);
    }
});

        // Re route to editing page of the selected book review

app.post("/editpost", async (req, res) => {
    console.log(updateBookID);
    try {

        const bookTitle = req.body.updateTitle;
        const bookReview = req.body.updateBookReview;
        const bookRating = req.body.updateRating;
        const currentDate = new Date();
        await db.query (
            "UPDATE books SET review_title = $1, review = $2, rating = $3, date = $4 WHERE id = $5",
            [bookTitle, bookReview, bookRating, currentDate, updateBookID]);
        res.redirect("/");
    
    } catch (err) {
        console.error(err.message);
    }
});

                /// Post route to create a new book review

                let currentBookID


app.post("/post", async (req, res) => {
    try {
        const newTitle = req.body.newTitle;
        const newBookReview = req.body.newBookReview;
        const newRating = req.body.newRating;
        const currentDate = new Date();
        const result = await db.query(
        "INSERT INTO books (review_title, review, rating, date) VALUES ($1, $2, $3, $4) RETURNING *",
         [newTitle, newBookReview, newRating, currentDate]);
        currentBookID = result.rows[0].id;
        console.log(currentBookID);
        
        const editedTitle = newTitle.replace(/\s/g, '%20');
        
        // Get Book_covers from API

        const response = await axios.get(`https://openlibrary.org/search.json?title=${editedTitle}`);
        
        const allBookCovers = response.data;

        // Empty array for filtered and mapped Book_covers

        let bookCovers = [];

        for (let book of allBookCovers['docs']) {
            const foundBook = {
                "title": book['title'],
                "author_name": book['author_name'],
                "author_key": `https://covers.openlibrary.org/a/olid/${book['author_key']}-S.jpg`, 
                "book_cover": `https://covers.openlibrary.org/b/olid/${book['cover_edition_key']}-M.jpg`,
            };
            if (foundBook['book_cover'] === undefined) {
                continue;
            } 
            bookCovers.push(foundBook);
        };
        bookCovers.forEach((book, index) => {
            book.id = index + 1;
        });
        res.render("bookreview.ejs", {bookCovers: bookCovers});    
    } catch (err) {
        console.error(err.message);
    }
    app.post("/bookcovers", async (req, res) => {
        const result2 = await db.query(
            "INSERT INTO book_covers (id, author_name, book_title, author_cover, book_cover) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [currentBookID, req.body.author, req.body.title,req.body.authorID, req.body.bookImgID]
    );
    let currentBook_CoverID = result2.rows[0].id;
    console.log(currentBook_CoverID);
    res.redirect("/");
});
});



app.listen(port, () => {
    console.log(`Server on: ${port}`)
});