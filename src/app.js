import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));


app.use(express.json({
    limit: "16kb"
})); /* to parse the incoming request body as JSON and set a maximum size limit of 16 kilobytes for the request body. This helps prevent excessively large payloads from being processed, which can be a security measure to mitigate potential denial-of-service (DoS) attacks. */

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
})); /* to parse incoming request bodies with URL-encoded payloads, which is commonly used for form submissions. This middleware allows the server to access the data sent in the request body as key-value pairs. */

app.use(express.static( " public" ));  /* to serve static files from a specified directory. This means that any files (such as images, CSS, JavaScript) placed in the designated directory can be accessed directly via URLs without needing specific routes to handle those requests. */

app.use(cookieParser()); /* to parse cookies attached to the client request object. This middleware allows the server to easily access and manipulate cookies sent by the client, which can be useful for session management, authentication, and other purposes. */
 
export default app;    