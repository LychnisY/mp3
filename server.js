import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { connect } from './db.js';
import routes from './routes/index.js';
import { badRequest } from './utils/response.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(morgan('dev'));

app.use('/api', routes);

// 400 for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return badRequest(res, 'Invalid JSON body');
  }
  return next(err);
});

const PORT = process.env.PORT || 3000;

connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Failed to connect to MongoDB', e);
    process.exit(1);
  });
