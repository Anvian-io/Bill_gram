# BillGram

Frontend runs on `http://localhost:3000`.

Backend scaffold lives in `server/` and is intended to run on `http://localhost:5000`.

Auth flow:

- user submits email
- backend checks the email against `USER_EMAIL` in env
- allowed emails can request and verify OTP
- successful OTP verification redirects the frontend to `/AdminPage`

Admin flow:

- generate invite tokens from backend
- register users with `email`, `name`, `phoneNumber`, and `token`
- used tokens are marked consumed in MongoDB
- all registered users can be fetched from the admin API
