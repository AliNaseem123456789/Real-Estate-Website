# Profit Builders — Real Estate Website

Buy, sell and rent homes, plots and commercial property.

- **client/** — React + Vite + Tailwind website (deployed on Netlify)
- **api/** — Express + MongoDB backend (deployed on Render)
- Images are stored on **Cloudinary**, Google sign-in uses **Firebase**, maps use **OpenStreetMap** (free, no key)

## Features

- Search by purpose, type, city, price range, bedrooms, bathrooms and area, with sorting and pages
- Saved properties (heart), compare up to 3 properties, recently viewed
- "Alert me": in-app notifications (bell icon) for new matching listings and price drops on saved properties
- My Listings dashboard: edit, delete, mark as sold, read enquiries, manage alerts
- Enquiries saved on the site + WhatsApp and call buttons
- Photo gallery with full-screen viewer, map pin for each property
- Mortgage/EMI calculator and Marla / Kanal / sq ft converter (`/tools`)
- Agent profiles with a verified badge (`/agents/:id`)
- Admin panel (`/admin`): approve, hide, delete and review reported listings; verify agents
- Share links with photo previews for WhatsApp / Facebook
- English / اردو switch (right-to-left layout)
- Chatbot shows matching listings from the site
- **Price map** (`/market`): typical prices per neighbourhood, rent vs buy, "where can I afford", and a
  "Price check" on each listing. The data comes from the separate `market-data` tool next to this project.

## Run it locally

You need Node.js 18+.

```bash
# 1. Backend
cd api
cp .env.example .env      # then fill in the values
npm install
npm run dev               # http://localhost:3001

# 2. Website (in a second terminal)
cd client
cp .env.example .env      # then fill in the values
npm install
npm run dev               # http://localhost:5173
```

### Make yourself an admin

Sign up on the website first, then:

```bash
cd api
npm run make-admin -- your@email.com
```

Sign out and in again and an Admin icon appears in the header.
Set `REQUIRE_APPROVAL=true` in `api/.env` if new listings should wait for an admin before going live.

The website calls the backend with paths like `/api/properties`.
In development Vite forwards them to `localhost:3001` (see `client/vite.config.js`);
on Netlify they are forwarded to the live backend (see `client/netlify.toml`).

## API

| Method | Path | Login | What it does |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | | Create an account |
| POST | `/api/auth/signin` | | Sign in with email + password |
| POST | `/api/auth/google` | | Sign in with Google (Firebase ID token) |
| GET | `/api/auth/signout` | | Sign out |
| POST | `/api/user/avatar` | ✔ | Upload a profile photo, returns `{ url }` |
| POST | `/api/user/update/:id` | ✔ | Update your profile |
| DELETE | `/api/user/delete/:id` | ✔ | Delete your account |
| GET | `/api/user/me` | ✔ | The signed-in user |
| GET | `/api/user/favorites` | ✔ | Saved properties |
| POST | `/api/user/favorites/:propertyId` | ✔ | Save / unsave a property |
| GET | `/api/properties` | | List. Filters: `action`, `type`, `city`, `minPrice`, `maxPrice`, `bedrooms`, `bathrooms`, `minArea` (sq ft), `sort`, `page`, `ids`, `owner` |
| GET | `/api/properties/cities` | | Cities that have listings |
| GET | `/api/properties/chat-search?q=` | | Listings matching a chat message |
| GET | `/api/properties/mine` | ✔ | Your own listings |
| GET | `/api/properties/:id` | | One property |
| POST | `/api/properties` | ✔ | Add a property (form data with up to 4 `images`) |
| PUT | `/api/properties/:id` | owner/admin | Edit (form data; `keepImages` = JSON list of photos to keep) |
| PATCH | `/api/properties/:id/sold` | owner/admin | `{ sold: true/false }` |
| DELETE | `/api/properties/:id` | owner/admin | Delete |
| POST | `/api/properties/:id/report` | ✔ | Report a listing `{ reason }` |
| POST | `/api/enquiries` | | Message a seller `{ propertyId, name, email, phone, message }` |
| GET | `/api/enquiries` | ✔ | Enquiries for your listings |
| GET | `/api/notifications` | ✔ | Bell notifications |
| GET/POST/DELETE | `/api/saved-searches` | ✔ | "Alert me" searches |
| GET | `/api/agents/:id` | | Public profile + listings |
| … | `/api/admin/...` | admin | stats, listings, users |
| GET | `/share/properties/:id` | | Share page with preview tags |
| GET | `/api/market/cities` | | Cities in the price data, biggest first |
| GET | `/api/market/areas?city=&purpose=&category=` | | Neighbourhood price stats for the map |
| GET | `/api/market/price-check/:propertyId` | | Compare a listing with its neighbourhood |

## Project structure

```
api/
  index.js              server setup
  routes/               URL → controller
  controllers/          what each route does
  models/               MongoDB schemas (User, Property, Enquiry, Notification, SavedSearch, AreaStat)
  middleware/           verifyToken / verifyAdmin (login checks), upload (images), rateLimit
  utils/                createError, cloudinary, area (Marla ↔ sq ft), propertyQuery (search filters), alerts
  scripts/              migrate-to-cloudinary, make-admin
client/src/
  pages/                one file per page
  components/           shared pieces (Header, PropertyCard, PropertyForm, Maps, ImageGallery…)
  components/Landing/   home page sections
  utils/                api (fetch helper), format (prices, WhatsApp, area units), localLists (compare / recently viewed)
  i18n.jsx              English / Urdu text
  redux/                signed-in user state
```

## Deploying

**Backend (Render):** root directory `api`, build `npm install`, start `npm start`.
Add every variable from `api/.env.example` in the Render dashboard, with
`NODE_ENV=production` and `CLIENT_URL` set to your Netlify address.

**Website (Netlify):** base directory `client`, build `npm run build`, publish `client/dist`.
Add the variables from `client/.env.example`. If the backend address changes,
update it in `client/netlify.toml`.
