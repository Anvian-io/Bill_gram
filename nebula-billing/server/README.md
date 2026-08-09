# BillGram Server

Endpoints included:

- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/admin/tokens`
- `POST /api/admin/users`
- `GET /api/admin/users`

Environment:

- `USER_EMAIL` should contain the allowed admin emails as a comma-separated list.
- `MONGODB_URI` points to the MongoDB database.
- `EXPOSE_OTP_IN_RESPONSE=true` is useful only for development.
- Brevo SMTP values can be provided through `SENDINBLUE_HOST`, `SENDINBLUE_PORT`, `SENDINBLUE_USER`, `SENDINBLUE_PASSWORD`, `SENDER_EMAIL`, and `SENDER_NAME`.
