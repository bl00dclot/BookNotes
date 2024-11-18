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
        const result = await db.query("SELECT * FROM books ORDER BY date DESC");
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
            "UPDATE books SET title = $1, review = $2, rating = $3, date = $4 WHERE id = $5",
            [bookTitle, bookReview, bookRating, currentDate, updateBookID]);
        res.redirect("/");
    
    } catch (err) {
        console.error(err.message);
    }
});

                /// Post route to create a new book review

app.post("/post", async (req, res) => {
    try {
        const newTitle = req.body.newTitle;
        const newBookReview = req.body.newBookReview;
        const newRating = req.body.newRating;
        const currentDate = new Date();
        await db.query("INSERT INTO books (title, review, rating, date) VALUES ($1, $2, $3, $4)", [newTitle, newBookReview, newRating, currentDate]);
        res.redirect("/");    
    } catch (err) {
        console.error(err.message)
    }
});

app.listen(port, () => {
    console.log(`Server on: ${port}`)
});